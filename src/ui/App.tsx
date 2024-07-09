import React, { useEffect, useState } from 'react';
import MapComponent from './component/Map';
import FileUploader from './component/FileUploader';
import { Node } from './types';
import { nodesToCSV, downloadCSV } from './utils/lonLat';

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

  const handleDownloadCSV = () => {
    const csv = nodesToCSV(nodes, center);
    downloadCSV(csv, 'lonlat.csv');
  };

  return (
    <>
      <FileUploader onNodeParsed={handleNodeParsed} />
      <button type="button" onClick={handleDownloadCSV}>
        Download lonlat
      </button>
      <MapComponent
        nodes={nodes}
        center={center}
        onCenterChange={handleCenterChange}
      />
    </>
  );
};

export default App;
