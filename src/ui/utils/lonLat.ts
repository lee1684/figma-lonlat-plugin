import { Node } from '../types';
import { pixelToLonLat } from './polygon';

export const nodesToCSV = (nodes: Node[], center: [number, number]): string => {
  const header = 'name,longitude,latitude\n';
  const rows = nodes
    .map((node) => {
      const { x, y, name } = node;
      const [longitude, latitude] = pixelToLonLat(x, y, center);
      return `${name},${longitude},${latitude}`;
    })
    .join('\n');

  return header + rows;
};

export const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
