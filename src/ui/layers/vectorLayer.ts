import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Fill, Stroke, Style, Icon } from 'ol/style';
import { FeatureLike } from 'ol/Feature';

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
