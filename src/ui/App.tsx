import React, { useEffect, useState, useRef } from 'react';
import MapComponent, { MapComponentHandle } from './component/Map';
import FileUploader from './component/FileUploader';
import { ExtractedNode } from './types';
import './App.css';
import { downloadJson, getPolygonGeometry } from './utils/lonLat';
import { FILE_ID, TOKEN } from '../config';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<ExtractedNode[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [json, setJson] = useState(null);
  const mapRef = useRef<MapComponentHandle>(null);

  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: 'get-nodes' } }, '*');

    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (message.type === 'selected-nodes') {
        setNodes(message.nodes);
      } else if (message.type === 'hide-loading') {
        setLoading(false);
      }
    };
  }, []);

  function parsePolygonGeometry(polygonString: string) {
    const coordinatesString = polygonString.match(/\(\((.+?)\)\)/)[1];
    const coordinates = coordinatesString
      .split(', ')
      .map((pair) => pair.split(' ').map(Number));
    return coordinates;
  }

  function calculateCenter(polygonGeometry: string) {
    const coordinates = parsePolygonGeometry(polygonGeometry);
    const numPoints = coordinates.length;
    let sumX = 0;
    let sumY = 0;

    coordinates.forEach((coord) => {
      sumX += coord[0];
      sumY += coord[1];
    });

    return [sumX / numPoints, sumY / numPoints];
  }

  const handleJsonUploaded = (jsonString: string) => {
    const jsonObject = JSON.parse(jsonString);
    setJson(jsonObject);

    const { id, name, type, polygon, absoluteBoundingBox } = jsonObject;
    const { x, y, width, height } = absoluteBoundingBox;
    const nodesFromJson: ExtractedNode[] = [];
    const node: ExtractedNode = {
      id,
      name,
      type,
      x,
      y,
      width,
      height,
      geometry: polygon,
    };
    nodesFromJson.push(node);
    setNodes(nodesFromJson);

    const center = calculateCenter(polygon);
    mapRef.current?.setCenter(center);
  };

  const handleDownloadJSON = async () => {
    setLoading(true);
    const nodeId = nodes[0].id;
    const response = await fetch(
      `https://api.figma.com/v1/files/${FILE_ID}/nodes?ids=${nodeId}&geometry=paths`,
      {
        headers: {
          'X-Figma-Token': TOKEN,
        },
      },
    );
    const data = await response.json();
    setLoading(false);
    const nodeData = data.nodes[nodeId].document;
    const polygonCoordinates = mapRef.current?.getPolygonCoordinates();
    nodeData.polygon = getPolygonGeometry(polygonCoordinates);
    downloadJson(nodeData, 'figma_node.json');
  };

  const handleClearPolygons = () => {
    setNodes([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendToFigma = () => {
    setLoading(true);

    const coordinates = mapRef.current?.getPolygonCoordinates();

    parent.postMessage(
      { pluginMessage: { type: 'create-nodes', coordinates } },
      '*',
    );
  };

  return (
    <div className="container">
      <div className="header">
        <FileUploader
          onJsonUploaded={handleJsonUploaded}
          fileInputRef={fileInputRef}
        />
        <button
          type="button"
          onClick={handleDownloadJSON}
          className="button"
          disabled={nodes.length === 0}
        >
          JSON 다운로드
        </button>
        <button
          type="button"
          onClick={handleSendToFigma}
          className="button"
          disabled={nodes.length === 0}
        >
          피그마로 보내기
        </button>
        <button
          type="button"
          onClick={handleClearPolygons}
          className="button"
          disabled={nodes.length === 0}
        >
          폴리곤 초기화
        </button>
      </div>
      <div className="mapContainer">
        <MapComponent ref={mapRef} nodes={nodes} />
      </div>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
};

export default App;
