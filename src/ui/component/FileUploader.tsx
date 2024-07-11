import React, { ChangeEvent, RefObject } from 'react';
import { parseCSV } from '../utils/CSVParser';
import { Node } from '../types';

interface FileUploaderProps {
  onNodesParsed: (node: Node[]) => void;
  fileInputRef: RefObject<HTMLInputElement>;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onNodesParsed,
  fileInputRef,
}) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseCSV(file).then(onNodesParsed).catch(console.error);
    }
  };

  return <input type="file" onChange={handleFileChange} ref={fileInputRef} />;
};

export default FileUploader;
