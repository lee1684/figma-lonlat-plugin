import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { ExtractedNode } from '../types';
import { getLonLat } from './lonLat';

export const getPolygonGeometry = (polygonCoordinates: number[][]) => {
  const topLeft = polygonCoordinates[0];
  const topRight = polygonCoordinates[1];
  const bottomRight = polygonCoordinates[2];
  const bottomLeft = polygonCoordinates[3];
  return `POLYGON((${topLeft[0]} ${topLeft[1]}, ${topRight[0]} ${topRight[1]}, ${bottomRight[0]} ${bottomRight[1]}, ${bottomLeft[0]} ${bottomLeft[1]}, ${topLeft[0]} ${topLeft[1]}))`;
};

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

export const createPolygon = (
  nodes: ExtractedNode[],
  center: Coordinate,
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
