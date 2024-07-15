import React, { useEffect, useState, useRef } from 'react';
import MapComponent from './component/Map';
import FileUploader from './component/FileUploader';
import { Node } from './types';
import { nodesToCSV, downloadCSV } from './utils/lonLat';
import './App.css';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [center, setCenter] = useState<[number, number]>([126.978, 37.5665]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: 'get-nodes' } }, '*');

    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (message.type === 'nodes') {
        setNodes(message.nodes);
      }
    };
  }, []);

  const handleNodesParsed = (parsedNode: Node[]) => {
    setNodes(parsedNode);
    const { geometry } = parsedNode[0];
    if (geometry) {
      const polygonTopLeft = geometry
        .replace('POLYGON((', '')
        .replace('))', '')
        .split(',')
        .map((coord) => coord.trim().split(' ').map(Number))[0];
      setCenter([polygonTopLeft[0], polygonTopLeft[1]]);
    }
  };

  const handleCenterChange = (newCenter: [number, number]) => {
    setCenter(newCenter);
  };

  const handleDownloadCSV = () => {
    const csv = nodesToCSV(nodes, center);
    downloadCSV(csv, 'lonlat.csv');
  };

  const handleClearPolygons = () => {
    setNodes([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendToFigma = () => {
    parent.postMessage({ pluginMessage: { type: 'create-nodes', nodes } }, '*');
  };

  return (
    <div className="container">
      <div className="header">
        <FileUploader
          onNodesParsed={handleNodesParsed}
          fileInputRef={fileInputRef}
        />
        <button
          type="button"
          onClick={handleDownloadCSV}
          className="button"
          disabled={nodes.length === 0}
        >
          위경도 좌표 다운로드
        </button>
        <button
          type="button"
          onClick={handleClearPolygons}
          className="button"
          disabled={nodes.length === 0}
        >
          폴리곤 초기화
        </button>
        <button
          type="button"
          onClick={handleSendToFigma}
          className="button"
          disabled={nodes.length === 0}
        >
          피그마로 보내기
        </button>
      </div>
      <div className="mapContainer">
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
