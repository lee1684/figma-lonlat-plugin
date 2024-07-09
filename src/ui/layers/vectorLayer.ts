import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Point } from 'ol/geom';
import { getCenter } from 'ol/extent';
import { FeatureLike } from 'ol/Feature';

export const createVectorLayer = (
  source: VectorSource<FeatureLike>,
): VectorLayer<FeatureLike> => {
  const vectorLayerStyle = new Style({
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

  return new VectorLayer({
    source,
    style: (feature) => {
      const styles = [vectorLayerStyle];
      const modifyGeometry = feature.get('modifyGeometry');
      const geometry = modifyGeometry
        ? modifyGeometry.geometry
        : feature.getGeometry();
      const center = getCenter(geometry.getExtent());
      if (center) {
        styles.push(
          new Style({
            geometry: new Point(center),
            image: new CircleStyle({
              radius: 4,
              fill: new Fill({
                color: '#ff3333',
              }),
            }),
          }),
        );
      }
      return styles;
    },
  });
};
