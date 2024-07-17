import React, {
  Ref,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { Coordinate } from 'ol/coordinate';
import { createVectorLayer } from '../layers/vectorLayer';
import { addModifyInteraction } from '../interactions/modifyInteraction';
import { addTranslateInteraction } from '../interactions/translateInteraction';
import { createPolygon } from '../utils/polygon';
import { ExtractedNode } from '../types';

interface MapComponentProps {
  nodes: ExtractedNode[];
}

export interface MapComponentHandle {
  getPolygonCoordinates: () => number[][] | null;
  getCenter: () => Coordinate | null;
  setCenter: (newCenter: Coordinate) => void;
}

const MapComponent = (
  { nodes }: MapComponentProps,
  ref: Ref<MapComponentHandle>,
) => {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const currentZoomRef = useRef<number>(14);
  const [center, setCenter] = useState<Coordinate>([126.978, 37.5665]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!mapElement.current) {
      return undefined;
    }

    const tileLayer = new TileLayer({
      source: new OSM(),
    });

    const vectorSource = new VectorSource();
    const vectorLayer = createVectorLayer(vectorSource);

    const map = new Map({
      layers: [tileLayer, vectorLayer],
      target: mapElement.current,
      view: new View({
        center: fromLonLat(center),
        zoom: currentZoomRef.current,
      }),
    });

    addTranslateInteraction(map, vectorLayer);
    addModifyInteraction(map, vectorSource);

    map.on('click', (event) => {
      event.preventDefault();
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat);
      if (feature) {
        return;
      }
      const clickedCoordinate = toLonLat(
        map.getCoordinateFromPixel(event.pixel),
      ) as [number, number];
      setCenter(clickedCoordinate);
    });

    map.getView().on('change:resolution', () => {
      currentZoomRef.current = map.getView().getZoom();
    });

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    mapElement.current.addEventListener('mousedown', handleMouseDown);
    mapElement.current.addEventListener('mouseup', handleMouseUp);

    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
      if (mapElement.current) {
        mapElement.current.removeEventListener('mousedown', handleMouseDown);
        mapElement.current.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      const view = mapRef.current.getView();
      const currentZoom = currentZoomRef.current;
      view.setCenter(fromLonLat(center));
      view.setZoom(currentZoom);

      const vectorLayer = mapRef.current
        .getLayers()
        .getArray()[1] as VectorLayer<Feature>;
      const vectorSource = vectorLayer.getSource() as VectorSource;
      vectorSource.clear();

      if (nodes.length > 0) {
        const polygons = createPolygon(nodes, center);
        vectorSource.addFeatures(polygons);
        const extent = vectorSource.getExtent();
        if (extent && extent[0] !== extent[2] && extent[1] !== extent[3]) {
          const centerX = (extent[0] + extent[2]) / 2;
          const centerY = (extent[1] + extent[3]) / 2;
          const newCenter = toLonLat([centerX, centerY]);
          view.setCenter(fromLonLat(newCenter));
        }
      }
    }
  }, [center, nodes]);

  useImperativeHandle(ref, () => ({
    getPolygonCoordinates: () => {
      const vectorLayer = mapRef.current
        ?.getLayers()
        .getArray()[1] as VectorLayer<Feature>;
      const vectorSource = vectorLayer.getSource() as VectorSource;
      const feature = vectorSource.getFeatures()[0];
      return (feature.getGeometry() as Polygon)
        .getCoordinates()[0]
        .map((coord) => toLonLat(coord));
    },
    getCenter: () => center,
    setCenter: (newCenter: [number, number]) => {
      setCenter(newCenter);
    },
  }));

  return (
    <div
      ref={mapElement}
      style={{
        width: '100%',
        height: '100%',
        cursor: isDragging ? 'grabbing' : 'crosshair',
      }}
    />
  );
};

export default forwardRef(MapComponent);
