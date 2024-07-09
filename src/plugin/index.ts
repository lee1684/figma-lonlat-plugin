figma.showUI(__html__, { width: 1500, height: 600 });

// 피그마로부터 선택된 노드를 가져오는 함수
const getSelectedNodes = async () => {
  const { selection } = figma.currentPage;
  return Promise.all(
    selection.map(async (node) => ({
      id: node.id,
      name: node.name,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    })),
  );
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
