export interface Node {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  children?: Array<Node>;
  geometry?: string;
  rotation?: number;
  cornerRadius?: number;
  depth?: number;
}
