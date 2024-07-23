import { CLIP_PATH_GROUP, ExtractedNode } from '../ui/types';

figma.showUI(__html__, { width: 1500, height: 600 });

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
  parentNode: BaseNode,
  coordinates: [number, number][],
) => {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  const labels = ['좌상단', '우상단', '우하단', '좌하단'];

  // const existCoordinatesLayer = (parentNode as any).children.find(
  //   (child) => child.name === 'Coordinates Layer',
  // );

  // if (existCoordinatesLayer) {
  //   existCoordinatesLayer.children.forEach((child, index) => {
  //     if (index < coordinates.length - 1) {
  //       const textNode = child as TextNode;
  //       textNode.characters = `${labels[index]}: ${coordinates[index][0]}, ${coordinates[index][1]}`;
  //     }
  //   });
  //   return;
  // }
  const hiddenLayer = figma.createFrame();
  hiddenLayer.visible = false;
  hiddenLayer.name = 'Coordinates Layer';

  coordinates.forEach((coord, index) => {
    if (index === coordinates.length - 1) {
      return;
    }
    const text = figma.createText();
    text.characters = `${labels[index]}: ${coord[0]}, ${coord[1]}`;
    hiddenLayer.appendChild(text);
    hiddenLayer.expanded = false;
  });

  if (
    parentNode.type === 'FRAME' ||
    parentNode.type === 'GROUP' ||
    parentNode.type === 'COMPONENT'
  ) {
    parentNode.appendChild(hiddenLayer);
  } else {
    const groupNode = figma.group([parentNode, hiddenLayer], figma.currentPage);
    groupNode.name = 'new Group';
    groupNode.expanded = false;
  }
};

const exportSVG = async (node: SceneNode) => {
  if (!node) {
    return null;
  }
  const svg = await node.exportAsync({
    format: 'SVG',
    svgIdAttribute: true,
    svgOutlineText: false,
    svgSimplifyStroke: false,
  });

  return svg;
};

const findNodeByName = (name: string): SceneNode | null => {
  const findNode = (nodes: ReadonlyArray<SceneNode>): SceneNode | null => {
    return nodes.reduce((found: SceneNode | null, node: SceneNode) => {
      if (found) return found;
      if (node.name === name) return node;
      if ('children' in node) return findNode(node.children);
      return null;
    }, null);
  };
  return findNode(figma.currentPage.children);
};

const uint8ArrayToString = (uint8Array: Uint8Array): string => {
  let result = '';
  const chunkSize = 0x8000; // 32 KB

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    result += String.fromCharCode.apply(null, chunk);
  }

  return result;
};

const createFigmaNode = (uint8Array: Uint8Array) => {
  const svgString = uint8ArrayToString(uint8Array);
  const nodeFromSvg = figma.createNodeFromSvg(svgString);
  const clipPathGroupNode = nodeFromSvg.children.find((child) => child.name === CLIP_PATH_GROUP,);
  const realNode = clipPathGroupNode
    ? (clipPathGroupNode as ChildrenMixin).children[1]
    : nodeFromSvg.children[0];
  const searchedNode = findNodeByName(realNode.name);
  if (searchedNode && 'absoluteRenderBounds' in searchedNode) {
    realNode.x = searchedNode.absoluteRenderBounds.x;
    realNode.y = searchedNode.absoluteRenderBounds.y;
  }
  figma.currentPage.appendChild(realNode);
  nodeFromSvg.remove();
  return realNode;
};

// 메시지 핸들러 함수
figma.ui.onmessage = async (msg) => {
  const { type, coordinates, svg } = msg;

  if (type === 'get-nodes') {
    const svg = await exportSVG(figma.currentPage.selection[0]);
    figma.ui.postMessage({
      type: 'selected-nodes',
      fileKey: figma.fileKey,
      nodes: figma.currentPage.selection.map(extractNodeAttributes),
      svg,
    });
  }
  if (type === 'create-nodes') {
    const createdNode = createFigmaNode(svg);
    await addHiddenLayer(createdNode, coordinates);

    figma.ui.postMessage({ type: 'hide-loading' });
  }
};
