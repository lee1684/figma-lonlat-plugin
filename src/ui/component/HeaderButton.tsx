import React from 'react';
import { Button } from '@mui/material';
import { HeaderButtonProps } from '../types';

const HeaderButton: React.FC<HeaderButtonProps> = ({ onClick, disabled, label }) => (
  <Button
    variant="contained"
    onClick={onClick}
    disabled={disabled}
    sx={{
      backgroundColor: '#A5D6A7',
      color: '#fff',
      '&:hover': {
        backgroundColor: '#81C784',
      },
    }}
  >
    {label}
  </Button>
);

export default HeaderButton;
