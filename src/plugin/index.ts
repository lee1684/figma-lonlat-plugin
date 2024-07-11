import { Node } from '../ui/types';

figma.showUI(__html__, { width: 1500, height: 600 });

const getAllNodes = (node) => {
  const nodes = [];
  const collectNodes = (collectNode: Node) => {
    nodes.push({
      id: collectNode.id,
      name: collectNode.name,
      x: collectNode.x,
      y: collectNode.y,
      width: collectNode.width,
      height: collectNode.height,
      type: collectNode.type,
      rotation: collectNode.rotation,
      cornerRadius: collectNode.cornerRadius,
    });
    if ('children' in collectNode) {
      (collectNode.children as Array<Node>).forEach((child) =>
        collectNodes(child),
      );
    }
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
};
