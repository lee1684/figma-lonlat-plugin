import { Coordinate } from 'ol/coordinate';
import { ExtractedNode, NodeWithSVG } from '../types';

export const pixelToLonLat = (
  x: number,
  y: number,
  center: Coordinate,
): Coordinate => {
  const scale = 0.000001;
  return [center[0] + x * scale, center[1] - y * scale];
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

export const downloadJson = (data, fileName: string) => {
  const prettyJson = JSON.stringify(data, null, 2);
  const blob = new Blob([prettyJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadSvg = (data: NodeWithSVG, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getGeometry = (node: ExtractedNode, center: Coordinate) => {
  const { x, y, width, height } = node;
  const topLeft = pixelToLonLat(x, y, center);
  const topRight = pixelToLonLat(x + width, y, center);
  const bottomRight = pixelToLonLat(x + width, y + height, center);
  const bottomLeft = pixelToLonLat(x, y + height, center);
  return `POLYGON((${topLeft[0]} ${topLeft[1]}, ${topRight[0]} ${topRight[1]}, ${bottomRight[0]} ${bottomRight[1]}, ${bottomLeft[0]} ${bottomLeft[1]}, ${topLeft[0]} ${topLeft[1]}))`;
}

const translateNodeToRow = (node, center, parent_id = '') => {
  const { x, y, width, height, name, id } = node;
  const geometry = getGeometry(node, center);
  let row = `${id},${name},${x},${y},${width},${height},${parent_id},"${geometry}"`;

  if (node.children && node.children.length > 0) {
    row += `\n${node.children.map(child => translateNodeToRow(child, center, id)).join('\n')}`;
  }

  return row;
};

export const translateNodesToCSV = (
  nodes: ExtractedNode[],
  center: Coordinate,
): string => {
  const header = 'id,name,x,y,width,height,parent_id,geometry\n';
  const rows = nodes.map(node => translateNodeToRow(node, center)).join('\n');
  return `${header}${rows}`;
};

export const downloadLonLat = (csv: string, filename: string) => {
  const bom = '\uFEFF';
  const csvWithBom = bom + csv;
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
