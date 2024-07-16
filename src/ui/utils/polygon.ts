import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { ExtractedNode } from '../types';

const scale = 0.000001;

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
