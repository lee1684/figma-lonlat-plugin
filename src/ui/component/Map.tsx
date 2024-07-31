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
import { FeatureLike } from 'ol/Feature';
import { Extent } from 'ol/extent';
import { createVectorLayer } from '../layers/vectorLayer';
import { addModifyInteraction } from '../interactions/modifyInteraction';
import { addTranslateInteraction } from '../interactions/translateInteraction';
import { createPolygon } from '../utils/polygon';
import { MapComponentHandle, MapComponentProps } from '../types';
import { addSvgOverlay } from '../utils/svgOverlay';

const MapComponent = (
  { nodes, svg }: MapComponentProps,
  ref: Ref<MapComponentHandle>,
) => {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const currentZoomRef = useRef<number>(14);
  const [center, setCenter] = useState<Coordinate>([126.978, 37.5665]);
  const [isDragging, setIsDragging] = useState(false);

  const setCenterOnMapClick = (map: Map) => {
    map.on('click', (event) => {
      event.preventDefault();
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat);
      if (feature) {
        return;
      }
      const clickedCoordinate = toLonLat(map.getCoordinateFromPixel(event.pixel));
      setCenter(clickedCoordinate);
    });
  }

  const updateSvgOverlaySize = (map: Map, vectorLayer: VectorLayer<FeatureLike>) => {
    map.getOverlays().clear();

    setTimeout(() => {
      const vectorSource = vectorLayer.getSource() as VectorSource;
      const features = vectorSource.getFeatures();
      features.forEach((feature) => {
        const geometry = feature.getGeometry();
        if (geometry instanceof Polygon) {
          addSvgOverlay(mapRef.current, geometry, svg);
        }
      });
    }, 0);
  };

  const handleZoomUpdate = (map: Map, vectorLayer: VectorLayer<FeatureLike>) => {
    map.getView().on('change:resolution', () => {
      currentZoomRef.current = map.getView().getZoom();
      updateSvgOverlaySize(map, vectorLayer);
    });
  }

  const createMap = (tileLayer: TileLayer<OSM>, vectorLayer: VectorLayer<FeatureLike>) => {
    return new Map({
      layers: [tileLayer, vectorLayer],
      target: mapElement.current,
      view: new View({
        center: fromLonLat(center),
        zoom: currentZoomRef.current,
      }),
    });
  }

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const setNewCenter = (extent: Extent) => {
    if (!extent || extent[0] === extent[2] || extent[1] === extent[3]) {
      return;
    }
    const centerX = (extent[0] + extent[2]) / 2;
    const centerY = (extent[1] + extent[3]) / 2;
    const newCenter = toLonLat([centerX, centerY]);
    const view = mapRef.current.getView();
    view.setCenter(fromLonLat(newCenter));
  }

  useEffect(() => {
    if (!mapElement.current) {
      return undefined;
    }

    const tileLayer = new TileLayer({
      source: new OSM(),
    });

    const vectorSource = new VectorSource();
    const vectorLayer = createVectorLayer(vectorSource);

    const map = createMap(tileLayer, vectorLayer);

    addTranslateInteraction(map, vectorLayer, svg);
    addModifyInteraction(map, vectorSource, svg);
    setCenterOnMapClick(map);
    handleZoomUpdate(map, vectorLayer);

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
  }, [svg]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const vectorLayer = mapRef.current
      .getLayers()
      .getArray()[1] as VectorLayer<Feature>;
    const vectorSource = vectorLayer.getSource() as VectorSource;
    vectorSource.clear();

    if (nodes.length <= 0) {
      return;
    }

    const polygons = createPolygon(nodes, center);
    vectorSource.addFeatures(polygons);
    const extent = vectorSource.getExtent();
    setNewCenter(extent);
    addSvgOverlay(mapRef.current, polygons[0].getGeometry(), svg);
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
      style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
    />
  );
};

export default forwardRef(MapComponent);
