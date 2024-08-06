import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { ExtractedNode } from '../types';
import { getLonLat } from './lonLat';

export const calculateDistance = (point1: Coordinate, point2: Coordinate): number => {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  return Math.sqrt(dx * dx + dy * dy);
};

export const getCornerCoordinates = (coordinates: Coordinate[]): Coordinate[] => {
  const topLeft = coordinates[0];
  const topRight = coordinates[1];
  const bottomRight = coordinates[2];
  const bottomLeft = coordinates[3];

  return [topLeft, topRight, bottomRight, bottomLeft];
};

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

const extractCoordinatesFromLayer = (layerNode: ExtractedNode): Coordinate[] => {
  const rawCoordinates = layerNode.children
    .map((child) => child.name)
    .map((childName) => {
      const lonLat = childName.split(':')[1];
      const lon = Number(lonLat.split(',')[0].trim());
      const lat = Number(lonLat.split(',')[1].trim());
      return [lon, lat];
    });

  rawCoordinates.push(rawCoordinates[0]);
  return rawCoordinates.map((coord) => fromLonLat(coord));
};

const extractCoordinatesFromNode = (node: ExtractedNode, center: Coordinate): Coordinate[] => {
  const { x, y, width, height, geometry } = node;

  if (geometry) {
    return geometry
      .replace('POLYGON((', '')
      .replace('))', '')
      .split(',')
      .map((coord) => coord.trim().split(' ').map(Number))
      .map(([lon, lat]) => fromLonLat([lon, lat]));
  }

  return getLonLat(x, y, width, height, center).map((coord) => fromLonLat(coord));
};

export const createPolygon = (
  nodes: ExtractedNode[],
  center: Coordinate,
): Feature<Polygon>[] => {
  if (!nodes || nodes.length === 0) return [];

  const coordinatesLayer = findCoordinatesLayerNode(nodes);
  let coordinates;

  if (coordinatesLayer) {
    coordinates = extractCoordinatesFromLayer(coordinatesLayer);
  } else {
    coordinates = extractCoordinatesFromNode(nodes[0], center);
  }

  const polygon = new Polygon([coordinates]);
  const feature = new Feature(polygon);

  return [feature];
};
