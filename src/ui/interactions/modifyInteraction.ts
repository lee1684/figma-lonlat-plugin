import { Map, Feature } from 'ol';
import { Modify } from 'ol/interaction';
import { Geometry, Point, Polygon } from 'ol/geom';
import { Vector as VectorSource } from 'ol/source';
import { getCenter } from 'ol/extent';
import { ModifyEvent } from 'ol/interaction/Modify';
import { addSvgOverlay } from '../utils/svgOverlay';

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

const handleModifyStart = (event: ModifyEvent, map: Map) => {
  map.getOverlays().clear();
  event.features.forEach((feature) => {
    feature.set(
      'modifyGeometry',
      { geometry: feature.getGeometry().clone() },
      true,
    );
  });
};

const handleModifyEnd = (event: ModifyEvent, map: Map, svg: Uint8Array) => {
  event.features.forEach((feature) => {
    const modifyGeometry = feature.get('modifyGeometry');
    if (!modifyGeometry) {
      return;
    }
    feature.setGeometry(modifyGeometry.geometry);
    feature.unset('modifyGeometry', true);

    const geometry = feature.getGeometry();
    if (geometry instanceof Polygon) {
      addSvgOverlay(map, geometry, svg);
    }
  });
};

const modifyStyleFunction = (vectorSource: VectorSource<Feature<Geometry>>) => (
  feature,
  resolution,
) => {
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

  const defaultStyle = new Modify({ source: vectorSource })
    .getOverlay()
    .getStyleFunction();
  return defaultStyle(feature, resolution);
};

export const addModifyInteraction = (
  map: Map,
  vectorSource: VectorSource<Feature<Geometry>>,
  svg: Uint8Array,
) => {
  const modify = new Modify({
    source: vectorSource,
    style: modifyStyleFunction(vectorSource),
  });

  modify.on('modifystart', (event) => handleModifyStart(event, map));
  modify.on('modifyend', (event) => handleModifyEnd(event, map, svg));

  map.addInteraction(modify);
};
