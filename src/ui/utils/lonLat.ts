import { Node } from '../types';
import { pixelToLonLat } from './polygon';

export const nodesToCSV = (nodes: Node[], center: [number, number]): string => {
  const header = 'name,x,y,width,height,rotation,cornerRadius,geometry\n';
  const rows = nodes
    .map((node) => {
      const { x, y, width, height, name, rotation, cornerRadius } = node;
      const topLeft = pixelToLonLat(x, y, center);
      const topRight = pixelToLonLat(x + width, y, center);
      const bottomRight = pixelToLonLat(x + width, y + height, center);
      const bottomLeft = pixelToLonLat(x, y + height, center);
      const geometry = `POLYGON((${topLeft[0]} ${topLeft[1]}, ${topRight[0]} ${topRight[1]}, ${bottomRight[0]} ${bottomRight[1]}, ${bottomLeft[0]} ${bottomLeft[1]}, ${topLeft[0]} ${topLeft[1]}))`;
      return `${name},${x},${y},${width},${height},${rotation || ''},${
        cornerRadius || ''
      },"${geometry}"`;
    })
    .join('\n');

  return header + rows;
};

export const downloadCSV = (csv: string, filename: string) => {
  const bom = '\uFEFF';
  const csvWithBom = bom + csv;
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
