import React from 'react';
import { Box, CircularProgress } from "@mui/material";


const Spinner = () => {

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      }}>
        <CircularProgress />
    </Box>
  )
}

export default Spinner;
