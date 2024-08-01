import { Coordinate } from "ol/coordinate";

export type ExtractedNode = {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children?: ExtractedNode[];
  geometry?: string;
};

export type NodeWithSVG = {
  parentNode: ExtractedNode;
  svgString: string;
};

export const CLIP_PATH_GROUP = 'Clip path group';

export interface MapComponentProps {
  nodes: ExtractedNode[];
  svg: Uint8Array,
}

export interface MapComponentHandle {
  getPolygonCoordinates: () => number[][] | null;
  getCenter: () => Coordinate | null;
  setCenter: (newCenter: Coordinate) => void;
}

export interface HeaderButtonProps {
  onClick: () => void;
  disabled: boolean;
  label: string;
}
