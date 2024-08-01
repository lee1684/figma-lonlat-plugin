import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Fill, Stroke, Style } from 'ol/style';
import Feature, { FeatureLike } from 'ol/Feature';
import { Map } from 'ol';
import { Geometry } from 'ol/geom';

export const getVectorLayer = (map: Map): VectorLayer<Feature<Geometry>> | null => {
  const layers = map.getLayers().getArray();
  for (let i = 0; i < layers.length; i++) {
    if (layers[i] instanceof VectorLayer) {
      return layers[i] as VectorLayer<Feature<Geometry>>;
    }
  }
  return null;
};

const frameStyle = new Style({
  geometry: (feature) => {
    const modifyGeometry = feature.get('modifyGeometry');
    return modifyGeometry ? modifyGeometry.geometry : feature.getGeometry();
  },
  fill: new Fill({
    color: 'rgba(255, 0, 0, 0.2)',
  }),
  stroke: new Stroke({
    color: '#ff0000',
    width: 2,
  }),
});

export const createVectorLayer = (
  source: VectorSource<FeatureLike>,
): VectorLayer<FeatureLike> => {
  return new VectorLayer({
    source,
    style: [frameStyle],
  });
};
