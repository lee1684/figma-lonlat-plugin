import { Map, Feature } from 'ol';
import { Modify } from 'ol/interaction';
import { Geometry, Point } from 'ol/geom';
import { Vector as VectorSource } from 'ol/source';
import { getCenter } from 'ol/extent';

export const addModifyInteraction = (
  map: Map,
  vectorSource: VectorSource<Feature<Geometry>>,
) => {
  const modify = new Modify({
    source: vectorSource,
    style: (feature, resolution) => {
      feature.get('features').forEach((modifyFeature) => {
        const modifyGeometry = modifyFeature.get('modifyGeometry');
        if (!modifyGeometry) {
          return;
        }
        const geometry = feature.getGeometry();
        if (!geometry || !(geometry instanceof Point)) {
          return;
        }
        const point = geometry.getCoordinates();
        let modifyPoint = modifyGeometry.point;
        if (!modifyPoint) {
          modifyPoint = point;
          modifyGeometry.point = modifyPoint;
          modifyGeometry.geometry0 = modifyGeometry.geometry;
        }
        const originalGeometry = modifyGeometry.geometry0;
        const center = getCenter(originalGeometry.getExtent());
        let dx;
        let dy;
        dx = modifyPoint[0] - center[0];
        dy = modifyPoint[1] - center[1];
        const initialRadius = Math.sqrt(dx * dx + dy * dy);
        const initialAngle = Math.atan2(dy, dx);
        dx = point[0] - center[0];
        dy = point[1] - center[1];
        const currentRadius = Math.sqrt(dx * dx + dy * dy);
        if (currentRadius <= 0) {
          return;
        }
        const currentAngle = Math.atan2(dy, dx);
        const clonedGeometry = originalGeometry.clone();
        clonedGeometry.scale(currentRadius / initialRadius, undefined, center);
        clonedGeometry.rotate(currentAngle - initialAngle, center);
        modifyGeometry.geometry = clonedGeometry;
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
