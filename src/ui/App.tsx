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
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <FileUploader onNodeParsed={handleNodeParsed} />
        <button
          type="button"
          onClick={handleDownloadCSV}
          style={{
            margin: '10px',
            padding: '10px',
          }}
          disabled={nodes.length === 0}
        >
          Download lonlat
        </button>
      </div>
      <div style={{ flex: 1 }}>
        <MapComponent
          nodes={nodes}
          center={center}
          onCenterChange={handleCenterChange}
        />
      </div>
    </div>
  );
};

export default App;
