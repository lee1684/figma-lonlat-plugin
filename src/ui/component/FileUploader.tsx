import React from 'react';
import { parseCSV } from '../utils/CSVParser';
import { Node } from '../types';

interface FileUploaderProps {
  onNodeParsed: (node: Node) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onNodeParsed }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    parseCSV(file)
      .then((node) => {
        onNodeParsed(node);
      })
      .catch((error) => {
        console.error('Error parsing CSV file:', error);
      });
  };

  return <input type="file" accept=".csv" onChange={handleFileChange} />;
};

export default FileUploader;
