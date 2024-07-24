import React, { useEffect, useState, useRef } from 'react';
import MapComponent, { MapComponentHandle } from './component/Map';
import FileUploader from './component/FileUploader';
import { ExtractedNode, NodeWithSVG } from './types';
import './App.css';
import { downloadJson, downloadLonLat, downloadSvg, getPolygonGeometry, translateNodesToCSV } from './utils/lonLat';
import { TOKEN } from '../config';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<ExtractedNode[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [json, setJson] = useState(null);
  const [svg, setSvg] = useState(null);
  const [fileKey, setFileKey] = useState('');
  const mapRef = useRef<MapComponentHandle>(null);

  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: 'get-nodes' } }, '*');

    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      const { type, nodes, fileKey, svg } = message;

      if (type === 'selected-nodes') {
        setSvg(svg);
        setFileKey(fileKey);
        setNodes(nodes);
      } else if (type === 'hide-loading') {
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
    const jsonObject: NodeWithSVG = JSON.parse(jsonString);
    const { parentNode, svgString } = jsonObject;
    const { id, name, type, x, y, width, height, geometry } = parentNode;
    const nodesFromJson: ExtractedNode[] = [];
    const node: ExtractedNode = {
      id,
      name,
      type,
      x,
      y,
      width,
      height,
      geometry,
    };
    nodesFromJson.push(node);
    setNodes(nodesFromJson);

    const center = calculateCenter(geometry);
    mapRef.current?.setCenter(center);
    const svg = new TextEncoder().encode(svgString);
    setSvg(svg);
  };

  const handleDownloadJSON = async () => {
    setLoading(true);
    const nodeId = nodes[0].id;
    const response = await fetch(
      `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}&geometry=paths`,
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

  const handleDownloadSvg = () => {
    const polygonCoordinates = mapRef.current?.getPolygonCoordinates();
    const { id, name, type, x, y, width, height } = nodes[0];
    const parentNode: ExtractedNode = {
      id,
      name,
      type,
      x,
      y,
      width,
      height,
      geometry: getPolygonGeometry(polygonCoordinates),
    };
    const json: NodeWithSVG = {
      parentNode,
      svgString: new TextDecoder().decode(svg),
    };
    downloadSvg(json, 'figma_svg');
  };

  const handleDownloadLonLat = () => {
    const center = mapRef.current?.getCenter();
    const csv = translateNodesToCSV(nodes, center);
    downloadLonLat(csv, 'lonlat.csv');
  }

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
      {
        pluginMessage: {
          type: 'create-nodes',
          coordinates,
          svg,
        },
      },
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
          onClick={handleDownloadSvg}
          className="button"
          disabled={nodes.length === 0}
        >
          JSON 다운로드
        </button>
        <button
          type="button"
          onClick={handleDownloadLonLat}
          className="button"
          disabled={nodes.length === 0}
        >
          위경도 좌표 다운로드
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
