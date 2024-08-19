import React from 'react';
import { Box } from "@mui/material";
import '../css/spinner.css';


const Spinner = () => {

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(3px)',
      }}>
      <div className="spinner" />
    </Box>
  )
}

export default Spinner;
