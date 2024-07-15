export type NodeType =
  | 'RECTANGLE'
  | 'POLYGON'
  | 'TEXT'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'INSTANCE'
  | 'BOOLEAN_OPERATION'
  | 'CONNECTOR'
  | 'SLICE'
  | 'LINE'
  | 'STAR'
  | 'COMPONENT';

export interface Node {
  id: number;
  name: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  rotation?: number;
  cornerRadius?: number;
  depth?: number;
  fills?: Paint[];
  strokes?: Paint[];
  geometry?: string;
  children?: Node[];
  characters?: string;
  fontSize?: number;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
}
