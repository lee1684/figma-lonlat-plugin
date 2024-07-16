import React, {
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
import { createVectorLayer } from '../layers/vectorLayer';
import { addModifyInteraction } from '../interactions/modifyInteraction';
import { addTranslateInteraction } from '../interactions/translateInteraction';
import { createPolygon } from '../utils/polygon';
import { ExtractedNode } from '../types';

interface MapComponentProps {
  nodes: ExtractedNode[];
  center: [number, number];
  onCenterChange: (newCenter: [number, number]) => void;
}

const MapComponent = (
  { nodes, center, onCenterChange }: MapComponentProps,
  ref,
) => {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const currentZoomRef = useRef<number>(14);
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
      onCenterChange(clickedCoordinate);
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
  }, [onCenterChange]);

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
          const currentCenter = view.getCenter();
          view.fit(extent, { padding: [100, 100, 100, 100] });
          view.setCenter(currentCenter);
          view.setZoom(currentZoom);
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
