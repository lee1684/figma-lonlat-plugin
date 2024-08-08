import React, { ChangeEvent } from 'react';
import { Button } from '@mui/material';
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

  return (
    <Button variant="contained" component="label">
      파일 업로드
      <input type="file" hidden onChange={handleFileChange} ref={fileInputRef} />
    </Button>
  );
};

export default FileUploaderButton;
