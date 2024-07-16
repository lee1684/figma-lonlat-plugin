import Papa from 'papaparse';
import { ExtractedNode } from '../types';

export const parseCSV = (file: File): Promise<ExtractedNode[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const nodes = results.data.map((row) => ({
          name: row.name,
          x: row.x,
          y: row.y,
          width: row.width,
          height: row.height,
          geometry: row.geometry,
        }));
        resolve(nodes);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
