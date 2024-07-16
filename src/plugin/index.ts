import { ExtractedNode } from '../ui/types';

figma.showUI(__html__, { width: 1500, height: 600 });

const createdNodes: { [key: string]: SceneNode } = {};

const setCommonProperties = (
  node: ExtractedNode,
  figmaNode: SceneNode,
): SceneNode => {
  const updatedNode = figmaNode;
  updatedNode.name = node.name;
  updatedNode.x = node.x;
  updatedNode.y = node.y;
  updatedNode.visible = node.visible;

  if ('resize' in updatedNode && typeof updatedNode.resize === 'function') {
    updatedNode.resize(node.width, node.height);
  }

  if ('rotation' in updatedNode && typeof updatedNode.rotation === 'number') {
    updatedNode.rotation = node.rotation;
  }

  if (
    'cornerRadius' in updatedNode &&
    typeof updatedNode.cornerRadius === 'number'
  ) {
    if (
      updatedNode.type === 'RECTANGLE' ||
      updatedNode.type === 'COMPONENT' ||
      updatedNode.type === 'INSTANCE'
    ) {
      (
        updatedNode as RectangleNode | ComponentNode | InstanceNode
      ).cornerRadius = node.cornerRadius;
    }
  }

  if ('fills' in updatedNode && Array.isArray(node.fills)) {
    updatedNode.fills = node.fills;
  }

  if ('strokes' in updatedNode && Array.isArray(node.strokes)) {
    updatedNode.strokes = node.strokes;
  }

  return updatedNode;
};

const createNodeInFigma = (node: ExtractedNode): SceneNode => {
  const appendChildren = (
    parentNode: FrameNode | ComponentNode | BooleanOperationNode,
    childrenNodes: ExtractedNode[],
  ) => {
    const children = childrenNodes.map(createNodeInFigma);
    children.forEach((childNode) => {
      if (childNode) {
        parentNode.appendChild(childNode);
      }
    });
  };

  if (createdNodes[node.id]) {
    return createdNodes[node.id];
  }

  let figmaNode;
  switch (node.type) {
    case 'RECTANGLE': {
      figmaNode = figma.createRectangle();
      break;
    }
    case 'POLYGON': {
      figmaNode = figma.createPolygon();
      break;
    }
    case 'TEXT': {
      figmaNode = figma.createText();
      if (node.characters) {
        figmaNode.characters = node.characters;
      }
      if (node.fontSize) {
        figmaNode.fontSize = node.fontSize;
      }
      if (node.textAlignHorizontal) {
        figmaNode.textAlignHorizontal = node.textAlignHorizontal;
      }
      if (node.textAlignVertical) {
        figmaNode.textAlignVertical = node.textAlignVertical;
      }
      break;
    }
    case 'FRAME': {
      figmaNode = figma.createFrame();
      appendChildren(figmaNode, node.children || []);
      break;
    }
    case 'GROUP': {
      const childrenNode = (node.children || []).map(createNodeInFigma);
      figmaNode = figma.group(childrenNode, figma.currentPage);
      break;
    }
    case 'VECTOR': {
      figmaNode = figma.createVector();
      break;
    }
    case 'BOOLEAN_OPERATION': {
      figmaNode = figma.createBooleanOperation();
      appendChildren(figmaNode, node.children || []);
      break;
    }
    case 'INSTANCE': {
      const component = figma.createComponent();
      appendChildren(component, node.children || []);
      figmaNode = component.createInstance();
      component.remove();
      break;
    }
    case 'LINE': {
      figmaNode = figma.createLine();
      break;
    }
    case 'STAR': {
      figmaNode = figma.createStar();
      break;
    }
    case 'COMPONENT': {
      figmaNode = figma.createComponent();
      appendChildren(figmaNode, node.children || []);
      break;
    }
    case 'SLICE': {
      figmaNode = figma.createSlice();
      break;
    }
    case 'CONNECTOR': {
      figmaNode = figma.createConnector();
      break;
    }
    default: {
      throw new Error(`Unsupported node type: ${node.type}`);
    }
  }

  figmaNode = setCommonProperties(node, figmaNode);
  createdNodes[node.id] = figmaNode;

  if ('expanded' in figmaNode) {
    figmaNode.expanded = false;
  }

  return figmaNode;
};

const extractNodeAttributes = (node: SceneNode): ExtractedNode => {
  const extractedNode: ExtractedNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  };

  if ('children' in node) {
    extractedNode.children = node.children.map(extractNodeAttributes);
  }

  return extractedNode;
};

// 위경도 좌표 레이어 추가 함수
const addHiddenLayer = async (
  parentNode: FrameNode | ComponentNode | GroupNode,
  coordinates: [number, number][],
) => {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  const hiddenLayer = figma.createFrame();
  hiddenLayer.visible = false;
  hiddenLayer.name = 'Coordinates Layer';

  const labels = ['좌상단', '우상단', '우하단', '좌하단'];

  coordinates.forEach((coord, index) => {
    if (index === coordinates.length - 1) {
      return;
    }
    const text = figma.createText();
    text.characters = `${labels[index]}: ${coord[0]}, ${coord[1]}`;
    hiddenLayer.appendChild(text);
    hiddenLayer.expanded = false;
  });

  parentNode.appendChild(hiddenLayer);
};

// 메시지 핸들러 함수
figma.ui.onmessage = async (msg) => {
  const { type, nodes } = msg;

  if (type === 'get-nodes') {
    figma.ui.postMessage({
      type: 'selected-nodes',
      nodes: figma.currentPage.selection.map(extractNodeAttributes),
    });
  }
  if (type === 'create-nodes') {
    const [firstNode] = nodes.map(createNodeInFigma);

    if (firstNode && nodes[0].coordinates) {
      await addHiddenLayer(firstNode, nodes[0].coordinates);
    }

    figma.ui.postMessage({ type: 'hide-loading' });
  }
};
