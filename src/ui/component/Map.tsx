import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { createVectorLayer } from '../layers/vectorLayer';
import { addModifyInteraction } from '../interactions/modifyInteraction';
import { addTranslateInteraction } from '../interactions/translateInteraction';
import { createPolygon } from '../utils/polygon';
import { Node } from '../types';

interface MapComponentProps {
  nodes: Node[];
  center: [number, number];
  onCenterChange: (newCenter: [number, number]) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  nodes,
  center,
  onCenterChange,
}) => {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const currentZoomRef = useRef<number>(12);

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
      const clickedCoordinate = toLonLat(
        map.getCoordinateFromPixel(event.pixel),
      ) as [number, number];
      onCenterChange(clickedCoordinate);
    });

    map.getView().on('change:resolution', () => {
      currentZoomRef.current = map.getView().getZoom();
    });

    mapRef.current = map;

    return () => map.setTarget(undefined);
  }, [onCenterChange]);

  useEffect(() => {
    if (mapRef.current) {
      const view = mapRef.current.getView();
      const currentZoom = currentZoomRef.current;
      view.setCenter(fromLonLat(center));
      view.setZoom(currentZoom);

      if (nodes.length > 0) {
        const vectorLayer = mapRef.current
          .getLayers()
          .getArray()[1] as VectorLayer<Feature>;
        const vectorSource = vectorLayer.getSource() as VectorSource;
        vectorSource.clear();
        const polygon = createPolygon(nodes, center);
        vectorSource.addFeatures(polygon);
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

  return <div ref={mapElement} style={{ width: '100%', height: '100%' }} />;
};

export default MapComponent;
