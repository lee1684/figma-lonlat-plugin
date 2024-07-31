import { Map } from 'ol';
import { Translate } from 'ol/interaction';
import { primaryAction } from 'ol/events/condition';
import { Vector as VectorLayer } from 'ol/layer';
import { FeatureLike } from 'ol/Feature';
import { TranslateEvent } from 'ol/interaction/Translate';
import { Polygon } from 'ol/geom';
import { addSvgOverlay } from '../utils/svgOverlay';

export const addTranslateInteraction = (
  map: Map,
  vectorLayer: VectorLayer<FeatureLike>,
  svg: Uint8Array,
) => {
  const translate = new Translate({
    condition: (event) => primaryAction(event),
    layers: [vectorLayer],
  });

  translate.on('translatestart', () => {
    map.getOverlays().clear();
  });

  translate.on('translateend', (event: TranslateEvent) => {
    event.features.forEach((feature) => {
      const geometry = feature.getGeometry();
      if (geometry instanceof Polygon) {
        addSvgOverlay(map, geometry, svg);
      }
    });
  });

  map.addInteraction(translate);
};
