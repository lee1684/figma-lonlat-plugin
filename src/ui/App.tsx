import React, { useEffect, useState, useRef } from 'react';
import { Box, Button, Container } from '@mui/material';
import MapComponent from './component/Map';
import FileUploaderButton from './component/FileUploaderButton';
import { ExtractedNode, MapComponentHandle, NodeWithSVG } from './types';
import { calculateCenter } from './utils/lonLat';
import { TOKEN } from '../config';
import { getPolygonGeometry } from './utils/polygon';
import { downloadJson, downloadLonLat, downloadSvg, translateNodesToCSV } from './utils/download';
import HeaderButton from './component/HeaderButton';
import LocationSearchButton from './component/LocationSearchButton';
import Spinner from './component/Spinner';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<ExtractedNode[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [json, setJson] = useState(null);
  const [svg, setSvg] = useState(null);
  const [fileKey, setFileKey] = useState('');
  const mapRef = useRef<MapComponentHandle>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: 'get-nodes' } }, '*');

    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      const { type, nodes, fileKey, svg } = message;

      if (type === 'selected-nodes') {
        setSvg(svg);
        setFileKey(fileKey);
        setNodes(nodes);
        inputRef.current.focus();
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
    <Container maxWidth='xl' sx={{ overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', mb: 2, mt: 2 }}>
        <FileUploaderButton onJsonUploaded={handleJsonUploaded} fileInputRef={fileInputRef} />
        <HeaderButton onClick={handleDownloadSvg} disabled={nodes.length === 0} label="JSON 다운로드" />
        <HeaderButton onClick={handleDownloadLonLat} disabled={nodes.length === 0} label="위경도 좌표 다운로드" />
        <HeaderButton onClick={handleSendToFigma} disabled={nodes.length === 0} label="피그마로 보내기" />
        <Button
          variant="contained"
          onClick={handleClearPolygons}
          disabled={nodes.length === 0}
          sx={{
            backgroundColor: '#e57373',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#f44336',
            },
          }}
        >
          초기화
        </Button>
        <LocationSearchButton
          mapRef={mapRef}
          inputRef={inputRef}
          setLoading={setLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Box>
      <Box sx={{ height: '490px', mb: 2, border: '2px solid #D3D3D3', borderRadius: '3px' }}>
        <MapComponent ref={mapRef} nodes={nodes} svg={svg} />
      </Box>
      {loading && <Spinner />}
    </Container>
  );
};

export default App;
