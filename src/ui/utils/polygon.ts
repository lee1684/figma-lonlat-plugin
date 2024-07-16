import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { ExtractedNode } from '../types';

const scale = 0.000001;

const findCoordinatesLayerNode = (
  deliveredNode: ExtractedNode[],
): ExtractedNode | null => {
  let foundNode: ExtractedNode | null = null;

  deliveredNode.forEach((node) => {
    if (node.name === 'Coordinates Layer') {
      foundNode = node;
    } else if (node.children) {
      const childNode = findCoordinatesLayerNode(node.children);
      if (childNode) {
        foundNode = childNode;
      }
    }
  });

  return foundNode;
};

export const pixelToLonLat = (
  x: number,
  y: number,
  center: [number, number],
): [number, number] => {
  return [center[0] + x * scale, center[1] - y * scale];
};

export const getLonLat = (
  x: number,
  y: number,
  width: number,
  height: number,
  center: [number, number],
) => {
  const topLeft = pixelToLonLat(x, y, center);
  const topRight = pixelToLonLat(x + width, y, center);
  const bottomRight = pixelToLonLat(x + width, y + height, center);
  const bottomLeft = pixelToLonLat(x, y + height, center);

  return [topLeft, topRight, bottomRight, bottomLeft, topLeft];
};

export const createPolygon = (
  nodes: ExtractedNode[],
  center: [number, number],
): Feature<Polygon>[] => {
  if (!nodes || nodes.length === 0) return [];

  const coordinatesLayer = findCoordinatesLayerNode(nodes);
  if (coordinatesLayer) {
    const rawCoordinates = coordinatesLayer.children
      .map((child) => child.name)
      .map((childName) => {
        const lonLat = childName.split(':')[1];
        const lon = Number(lonLat.split(',')[0].trim());
        const lat = Number(lonLat.split(',')[1].trim());
        return [lon, lat];
      });
    rawCoordinates.push(rawCoordinates[0]);
    const coordinates = rawCoordinates.map((coord) => fromLonLat(coord));

    const polygon = new Polygon([coordinates]);
    const feature = new Feature(polygon);

    return [feature];
  }

  const node = nodes[0];
  const { x, y, width, height, geometry } = node;

  let coordinates;
  if (geometry) {
    coordinates = geometry
      .replace('POLYGON((', '')
      .replace('))', '')
      .split(',')
      .map((coord) => coord.trim().split(' ').map(Number))
      .map(([lon, lat]) => fromLonLat([lon, lat]));
  } else {
    coordinates = getLonLat(x, y, width, height, center).map((coord) =>
      fromLonLat(coord),
    );
  }

  const polygon = new Polygon([coordinates]);
  const feature = new Feature(polygon);

  return [feature];
};
