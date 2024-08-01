import { Map, Overlay } from 'ol';
import { Polygon } from 'ol/geom';
import { calculateDistance, getCornerCoordinates } from './polygon';
import { getVectorLayer } from '../layers/vectorLayer';

const uint8ArrayToBase64 = (uint8Array: Uint8Array): string => {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
};

const createOverlayElement = (svgBase64: string, rotation: number): HTMLDivElement => {
  const overlayElement = document.createElement('div');
  overlayElement.innerHTML = `<img src="data:image/svg+xml;base64,${svgBase64}" />`;
  overlayElement.style.position = 'absolute';
  overlayElement.style.transform = rotation ? `translate(-50%, -50%) rotate(${rotation}rad)` : 'translate(-50%, -50%)';
  overlayElement.style.pointerEvents = 'none';
  return overlayElement;
};

const setOverlaySize = (overlayElement: HTMLDivElement, coordinates: number[][], map: Map): void => {
  const topLeft = coordinates[0];
  const topRight = coordinates[1];
  const bottomLeft = coordinates[3];

  const width = calculateDistance(topLeft, topRight);
  const height = calculateDistance(topLeft, bottomLeft);
  const scale = 1 / map.getView().getResolution();

  const widthScaled = `${width * scale}px`;
  const heightScaled = `${height * scale}px`;

  const newStyle = {
    width: widthScaled,
    height: heightScaled,
  };

  Object.assign(overlayElement.style, newStyle);

  const imgElement = overlayElement.querySelector('img');
  if (imgElement) {
    Object.assign(imgElement.style, newStyle);
  }
};

const calculateCenter = (coordinates: number[][]): [number, number] => {
  const [topLeft, topRight, bottomRight, bottomLeft] = coordinates;
  return [
    (topLeft[0] + topRight[0] + bottomRight[0] + bottomLeft[0]) / 4,
    (topLeft[1] + topRight[1] + bottomRight[1] + bottomLeft[1]) / 4,
  ];
};

export const addSvgOverlay = (map: Map, geometry: Polygon, svg: Uint8Array): void => {
  if (!geometry || !svg) return;

  const coordinates = geometry.getCoordinates()[0];
  const corners = getCornerCoordinates(coordinates);
  const svgBase64 = uint8ArrayToBase64(svg);

  const dx = corners[1][0] - corners[0][0];
  const dy = corners[1][1] - corners[0][1];
  const rotation = -Math.atan2(dy, dx);

  const overlayElement = createOverlayElement(svgBase64, rotation);
  setOverlaySize(overlayElement, coordinates, map);

  const center = calculateCenter(coordinates);
  const overlay = new Overlay({
    element: overlayElement,
    position: center,
    positioning: 'center-center',
  });

  map.addOverlay(overlay);
};

export const updateSvgOverlaySize = (map: Map, svg: Uint8Array) => {
  map.getOverlays().clear();
  const vectorLayer = getVectorLayer(map);

  setTimeout(() => {
    const features = vectorLayer.getSource().getFeatures();
    features.forEach((feature) => {
      const geometry = feature.getGeometry();
      if (geometry instanceof Polygon) {
        addSvgOverlay(map, geometry, svg);
      }
    });
  }, 0);
};
