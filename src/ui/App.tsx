import React, { useEffect, useState, useRef } from 'react';
import MapComponent from './component/Map';
import FileUploader from './component/FileUploader';
import { ExtractedNode, MapComponentHandle, NodeWithSVG } from './types';
import './App.css';
import { calculateCenter } from './utils/lonLat';
import { TOKEN } from '../config';
import { getPolygonGeometry } from './utils/polygon';
import { downloadJson, downloadLonLat, downloadSvg, translateNodesToCSV } from './utils/download';
import HeaderButton from './component/HeaderButton';

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
        <HeaderButton
          onClick={handleDownloadSvg}
          disabled={nodes.length === 0}
          label="JSON 다운로드"
        />
        <HeaderButton
          onClick={handleDownloadLonLat}
          disabled={nodes.length === 0}
          label="위경도 좌표 다운로드"
        />
        <HeaderButton
          onClick={handleSendToFigma}
          disabled={nodes.length === 0}
          label="피그마로 보내기"
        />
        <HeaderButton
          onClick={handleClearPolygons}
          disabled={nodes.length === 0}
          label="폴리곤 초기화"
        />
      </div>
      <div className="mapContainer">
        <MapComponent ref={mapRef} nodes={nodes} svg={svg} />
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
