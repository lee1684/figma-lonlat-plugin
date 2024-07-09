import { Map, Feature } from 'ol';
import { Modify } from 'ol/interaction';
import { Geometry, Point } from 'ol/geom';
import { Vector as VectorSource } from 'ol/source';

import { getCenter, getHeight, getWidth } from 'ol/extent';
import {
  never,
  platformModifierKeyOnly,
  primaryAction,
} from 'ol/events/condition';

export const addModifyInteraction = (
  map: Map,
  vectorSource: VectorSource<Feature<Geometry>>,
) => {
  const modify = new Modify({
    source: vectorSource,
    condition: (event) =>
      primaryAction(event) && !platformModifierKeyOnly(event),
    deleteCondition: never,
    insertVertexCondition: never,
    style: (feature, resolution) => {
      feature.get('features').forEach((modifyFeature) => {
        const modifyGeometry = modifyFeature.get('modifyGeometry');
        if (modifyGeometry) {
          const geometry = feature.getGeometry();
          if (geometry && geometry instanceof Point) {
            const point = geometry.getCoordinates();
            let modifyPoint = modifyGeometry.point;
            if (!modifyPoint) {
              modifyPoint = point;
              modifyGeometry.point = modifyPoint;
              modifyGeometry.geometry0 = modifyGeometry.geometry;
            }
            const center = getCenter(modifyGeometry.geometry0.getExtent());
            const minRadius =
              Math.max(
                getWidth(modifyGeometry.geometry0.getExtent()),
                getHeight(modifyGeometry.geometry0.getExtent()),
              ) / 3;
            let dx;
            let dy;
            dx = modifyPoint[0] - center[0];
            dy = modifyPoint[1] - center[1];
            const initialRadius = Math.sqrt(dx * dx + dy * dy);
            if (initialRadius > minRadius) {
              const initialAngle = Math.atan2(dy, dx);
              dx = point[0] - center[0];
              dy = point[1] - center[1];
              const currentRadius = Math.sqrt(dx * dx + dy * dy);
              if (currentRadius > 0) {
                const currentAngle = Math.atan2(dy, dx);
                const modifiedGeometry = modifyGeometry.geometry0.clone();
                modifiedGeometry.scale(
                  currentRadius / initialRadius,
                  undefined,
                  center,
                );
                modifiedGeometry.rotate(currentAngle - initialAngle, center);
                modifyGeometry.geometry = modifiedGeometry;
              }
            }
          }
        }
      });
      const defaultStyle = new Modify({ source: vectorSource })
        .getOverlay()
        .getStyleFunction();
      return defaultStyle(feature, resolution);
    },
  });

  modify.on('modifystart', (event) => {
    event.features.forEach((feature) => {
      feature.set(
        'modifyGeometry',
        { geometry: feature.getGeometry().clone() },
        true,
      );
    });
  });

  modify.on('modifyend', (event) => {
    event.features.forEach((feature) => {
      const modifyGeometry = feature.get('modifyGeometry');
      if (modifyGeometry) {
        feature.setGeometry(modifyGeometry.geometry);
        feature.unset('modifyGeometry', true);
      }
    });
  });

  map.addInteraction(modify);
};
