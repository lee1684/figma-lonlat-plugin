import { Coordinate } from "ol/coordinate";
import { ExtractedNode, NodeWithSVG } from "../types";
import { getGeometry } from "./lonLat";

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
