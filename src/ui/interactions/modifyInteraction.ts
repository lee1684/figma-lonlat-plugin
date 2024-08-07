import { Map, Feature } from 'ol';
import { Modify } from 'ol/interaction';
import { Geometry, Point, Polygon } from 'ol/geom';
import { getCenter } from 'ol/extent';
import { ModifyEvent } from 'ol/interaction/Modify';
import { FeatureLike } from 'ol/Feature';
import { Coordinate } from 'ol/coordinate';
import { addSvgOverlay } from '../utils/svgOverlay';
import { getVectorLayer } from '../layers/vectorLayer';
import { removeInteractions } from './removeInteraction';
import { calculateDistance } from '../utils/polygon';

const calculateGeometryTransformation = (
  originalGeometry: Geometry,
  modifyPoint: number[],
  point: number[],
) => {
  const center = getCenter(originalGeometry.getExtent());
  const dxInitial = modifyPoint[0] - center[0];
  const dyInitial = modifyPoint[1] - center[1];
  const initialRadius = Math.sqrt(dxInitial * dxInitial + dyInitial * dyInitial);
  const initialAngle = Math.atan2(dyInitial, dxInitial);

  const dxCurrent = point[0] - center[0];
  const dyCurrent = point[1] - center[1];
  const currentRadius = Math.sqrt(dxCurrent * dxCurrent + dyCurrent * dyCurrent);
  if (currentRadius <= 0) {
    return null;
  }
  const currentAngle = Math.atan2(dyCurrent, dxCurrent);

  const clonedGeometry = originalGeometry.clone();
  clonedGeometry.scale(currentRadius / initialRadius, undefined, center);
  clonedGeometry.rotate(currentAngle - initialAngle, center);
  return clonedGeometry;
};

const handleModifyStart = (
  event: ModifyEvent, 
  map: Map, 
  setIsCtrlPressed: (isCtrlPressed: boolean) => void,
  undoStack: React.MutableRefObject<Feature[]>,
  redoStack: React.MutableRefObject<Feature[]>,
) => {
  map.getOverlays().clear();
  const isCtrlPressed = event.mapBrowserEvent?.originalEvent?.ctrlKey;
  if (isCtrlPressed) {
    setIsCtrlPressed(isCtrlPressed);
    return;
  }
  event.features.forEach((feature) => {
    undoStack.current.push(feature.clone());
    redoStack.current = [];
    feature.set(
      'modifyGeometry',
      { geometry: feature.getGeometry().clone() },
      true,
    );
  });
};

const handleModifyEnd = (event: ModifyEvent, map: Map, svg: Uint8Array, isCtrlPressed: boolean) => {
  event.features.forEach((feature) => {
    const modifyGeometry = feature.get('modifyGeometry');
    if (!modifyGeometry) {
      return;
    }
    feature.setGeometry(modifyGeometry.geometry);
    feature.unset('modifyGeometry', true);

    if (isCtrlPressed) {
      return;
    }
    const geometry = feature.getGeometry();
    if (geometry instanceof Polygon) {
      addSvgOverlay(map, geometry, svg);
    }
  });
};

const modifyStyleFunction = (feature: FeatureLike) => {
  feature.get('features').forEach((modifyFeature) => {
    const modifyGeometry = modifyFeature.get('modifyGeometry');
    if (!modifyGeometry) {
      return;
    }
    const geometry = feature.getGeometry();
    if (!geometry || !(geometry instanceof Point)) {
      return;
    }
    const point = geometry.getCoordinates();
    let modifyPoint = modifyGeometry.point;
    if (!modifyPoint) {
      modifyPoint = point;
      modifyGeometry.point = modifyPoint;
      modifyGeometry.geometry0 = modifyGeometry.geometry;
    }
    const originalGeometry = modifyGeometry.geometry0;
    const transformedGeometry = calculateGeometryTransformation(
      originalGeometry,
      modifyPoint,
      point,
    );
    if (transformedGeometry) {
      modifyGeometry.geometry = transformedGeometry;
    }
  });
};

const isCloseToCorner = (map: Map, coordinates: Coordinate[], pixel) => {
  return coordinates.some(([x, y]) => {
    const [px, py] = map.getPixelFromCoordinate([x, y]);
    const distance = calculateDistance([px, py], pixel);
    return distance < 10;
  });
};

const modifyCondition = (event, map: Map) => {
  const { pixel } = event;
  const vectorLayer = getVectorLayer(event.map);
  const geometry = vectorLayer.getSource().getFeatures()[0].getGeometry();
  
  if (!(geometry instanceof Polygon)) {
    return false;
  }

  const coordinates = geometry.getCoordinates()[0];
  return isCloseToCorner(map, coordinates, pixel);
};

export const addModifyInteraction = (
  map: Map,
  svg: Uint8Array,
  setIsCtrlPressed: (isCtrlPressed: boolean) => void,
  undoStack: React.MutableRefObject<Feature[]>,
  redoStack: React.MutableRefObject<Feature[]>,
  isCtrlPressed = false,
) => {
  removeInteractions(map, 'Modify');

  const vectorSource = getVectorLayer(map).getSource();
  const modify = new Modify({
    source: vectorSource,
    style: modifyStyleFunction,
    condition: (event) => modifyCondition(event, map),
  });

  modify.on('modifystart', (event) => handleModifyStart(event, map, setIsCtrlPressed, undoStack, redoStack));
  modify.on('modifyend', (event) => handleModifyEnd(event, map, svg, isCtrlPressed));

  map.addInteraction(modify);
};
