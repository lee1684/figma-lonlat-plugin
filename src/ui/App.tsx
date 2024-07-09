import React, { useEffect, useState } from 'react';
import MapComponent from './component/Map';
import FileUploader from './component/FileUploader';
import { Node } from './types';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [center, setCenter] = useState<[number, number]>([126.978, 37.5665]);

  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: 'get-nodes' } }, '*');

    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (message.type === 'nodes') {
        setNodes(message.nodes);
      }
    };
  }, []);

  const handleNodeParsed = (parsedNode: Node) => {
    setNodes((prevNodes) => [...prevNodes, parsedNode]);
  };

  const handleCenterChange = (newCenter: [number, number]) => {
    setCenter(newCenter);
  };

  return (
    <>
      <FileUploader onNodeParsed={handleNodeParsed} />
      <MapComponent
        nodes={nodes}
        center={center}
        onCenterChange={handleCenterChange}
      />
    </>
  );
};

export default App;
