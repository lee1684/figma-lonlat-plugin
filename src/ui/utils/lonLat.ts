import { Coordinate } from 'ol/coordinate';
import { ExtractedNode } from '../types';

const pixelToLonLat = (x: number, y: number, center: Coordinate) => {
  const scaleX = 0.0000001;
  const scaleY = 0.00000008;
  return [center[0] + x * scaleX, center[1] - y * scaleY];
};

export const getLonLat = (
  x: number,
  y: number,
  width: number,
  height: number,
  center: Coordinate,
) => {
  const topLeft = pixelToLonLat(x, y, center);
  const topRight = pixelToLonLat(x + width, y, center);
  const bottomRight = pixelToLonLat(x + width, y + height, center);
  const bottomLeft = pixelToLonLat(x, y + height, center);

  return [topLeft, topRight, bottomRight, bottomLeft, topLeft];
};

export const getGeometry = (node: ExtractedNode, center: Coordinate) => {
  const { x, y, width, height } = node;
  const topLeft = pixelToLonLat(x, y, center);
  const topRight = pixelToLonLat(x + width, y, center);
  const bottomRight = pixelToLonLat(x + width, y + height, center);
  const bottomLeft = pixelToLonLat(x, y + height, center);
  return `POLYGON((${topLeft[0]} ${topLeft[1]}, ${topRight[0]} ${topRight[1]}, ${bottomRight[0]} ${bottomRight[1]}, ${bottomLeft[0]} ${bottomLeft[1]}, ${topLeft[0]} ${topLeft[1]}))`;
}

const parsePolygonGeometry = (polygonString: string) => {
  const coordinatesString = polygonString.match(/\(\((.+?)\)\)/)[1];
  const coordinates = coordinatesString
    .split(', ')
    .map((pair) => pair.split(' ').map(Number));
  return coordinates;
}

export const calculateCenter = (polygonGeometry: string) => {
  const coordinates = parsePolygonGeometry(polygonGeometry);
  const numPoints = coordinates.length;
  let sumX = 0;
  let sumY = 0;

  coordinates.forEach((coord) => {
    sumX += coord[0];
    sumY += coord[1];
  });

  return [sumX / numPoints, sumY / numPoints];
}
