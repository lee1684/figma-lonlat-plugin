import { Map } from 'ol';
import { Translate } from 'ol/interaction';
import { primaryAction } from 'ol/events/condition';
import { TranslateEvent } from 'ol/interaction/Translate';
import { Polygon } from 'ol/geom';
import { addSvgOverlay } from '../utils/svgOverlay';
import { getVectorLayer } from '../layers/vectorLayer';
import { removeInteractions } from './removeInteraction';

export const addTranslateInteraction = (
  map: Map,
  svg: Uint8Array,
  isCtrlPressed = false,
) => {
  removeInteractions(map, 'Translate');

  const vectorLayer = getVectorLayer(map);
  const translate = new Translate({
    condition: (event) => primaryAction(event),
    layers: [vectorLayer],
  });

  translate.on('translatestart', () => {
    map.getOverlays().clear();
  });

  translate.on('translateend', (event: TranslateEvent) => {
    if (isCtrlPressed) {
      return;
    }
    event.features.forEach((feature) => {
      const geometry = feature.getGeometry();
      if (geometry instanceof Polygon) {
        addSvgOverlay(map, geometry, svg);
      }
    });
  });

  map.addInteraction(translate);
};
