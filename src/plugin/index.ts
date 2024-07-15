import { Node } from '../ui/types';

figma.showUI(__html__, { width: 1500, height: 600 });

const createdNodes: { [key: string]: SceneNode } = {};

const setCommonProperties = (node: Node, figmaNode: SceneNode): SceneNode => {
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

const createNodeInFigma = (node: Node): SceneNode => {
  const appendChildren = (
    parentNode: FrameNode | ComponentNode | BooleanOperationNode,
    childrenNodes: Node[],
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

const getAllNodes = (node) => {
  const nodes = [];
  const collectNodes = (collectNode: Node) => {
    const newNode: Node = {
      id: collectNode.id,
      name: collectNode.name,
      x: collectNode.x,
      y: collectNode.y,
      width: collectNode.width,
      height: collectNode.height,
      type: collectNode.type,
      rotation: collectNode.rotation,
      cornerRadius: collectNode.cornerRadius,
      children: undefined,
    };
    nodes.push(newNode);

    if ('children' in collectNode) {
      newNode.children = (collectNode.children as Array<Node>).map((child) =>
        collectNodes(child),
      );
    }

    return newNode;
  };
  collectNodes(node);
  return nodes;
};

// 피그마로부터 선택된 노드를 가져오는 함수
const getSelectedNodes = async () => {
  const { selection } = figma.currentPage;
  let nodes = [];
  selection.forEach((node) => {
    nodes = nodes.concat(getAllNodes(node));
  });
  return nodes;
};

// 노드를 피그마 플러그인 UI로 전송하는 함수
const postNodesToUI = (nodes) => {
  figma.ui.postMessage({
    type: 'nodes',
    nodes,
  });
};

// 메시지 핸들러 함수
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'get-nodes') {
    const nodes = await getSelectedNodes();
    postNodesToUI(nodes);
  }
  if (msg.type === 'create-nodes') {
    msg.nodes.forEach((node) => {
      createNodeInFigma(node);
    });

    figma.ui.postMessage({ type: 'hide-loading' });
  }
};
