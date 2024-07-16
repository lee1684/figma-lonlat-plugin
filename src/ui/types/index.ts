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
