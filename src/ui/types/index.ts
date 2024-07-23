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
