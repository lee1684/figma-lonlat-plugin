import Papa from 'papaparse';
import { Node } from '../types';

export const parseCSV = (file: File): Promise<Node> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const firstRow = results.data[0] as Node;
        if (firstRow) {
          const node: Node = {
            name: firstRow.name,
            x: firstRow.x,
            y: firstRow.y,
            width: firstRow.width,
            height: firstRow.height,
          };
          resolve(node);
        } else {
          reject(
            new Error('CSV file is empty or does not contain valid data.'),
          );
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
