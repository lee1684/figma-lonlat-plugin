import { Map } from 'ol';
import { Translate } from 'ol/interaction';
import { primaryAction, platformModifierKeyOnly } from 'ol/events/condition';
import { Vector as VectorLayer } from 'ol/layer';
import { FeatureLike } from 'ol/Feature';

export const addTranslateInteraction = (
  map: Map,
  vectorLayer: VectorLayer<FeatureLike>,
) => {
  map.addInteraction(
    new Translate({
      condition: (event) =>
        primaryAction(event) && platformModifierKeyOnly(event),
      layers: [vectorLayer],
    }),
  );
};
