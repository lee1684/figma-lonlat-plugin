import { ExtractedNode } from '../ui/types';

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
  parentNode: SceneNode,
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

// 메시지 핸들러 함수
figma.ui.onmessage = async (msg) => {
  const { type, coordinates } = msg;

  if (type === 'get-nodes') {
    figma.ui.postMessage({
      type: 'selected-nodes',
      nodes: figma.currentPage.selection.map(extractNodeAttributes),
    });
  }
  if (type === 'create-nodes') {
    const originalNodes = figma.currentPage.selection[0];
    const hasAbsoluteRenderBounds =
      'absoluteRenderBounds' in originalNodes &&
      originalNodes.absoluteRenderBounds;
    const clone = originalNodes.clone();
    clone.x = hasAbsoluteRenderBounds
      ? originalNodes.absoluteRenderBounds.x
      : originalNodes.x;
    clone.y = hasAbsoluteRenderBounds
      ? originalNodes.absoluteRenderBounds.y
      : originalNodes.y;
    if ('expanded' in clone) {
      clone.expanded = false;
    }
    await addHiddenLayer(clone, coordinates);

    figma.ui.postMessage({ type: 'hide-loading' });
  }
};
