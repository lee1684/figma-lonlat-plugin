import React, { ChangeEvent } from 'react';
import { FileUploaderButtonProps } from '../types';

const FileUploaderButton: React.FC<FileUploaderButtonProps> = ({
  onJsonUploaded,
  fileInputRef,
}) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const jsonString = reader.result;
        if (typeof jsonString === 'string') {
          onJsonUploaded(jsonString);
        }
      };
      reader.readAsText(file);
    }
  };

  return <input type="file" onChange={handleFileChange} ref={fileInputRef} />;
};

export default FileUploaderButton;
