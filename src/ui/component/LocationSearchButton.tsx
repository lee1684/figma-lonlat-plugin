import React from 'react';
import { Box, Button, TextField } from '@mui/material';
import { LocationSearchButtonProps } from '../types';

const LocationSearchButton = ({
  mapRef,
  inputRef,
  setLoading,
  searchQuery,
  setSearchQuery,
}: LocationSearchButtonProps) => {
  const searchLocation = async (query: string) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&addressdetails=1&limit=1`
    );
    const results = await response.json();
    return results.length > 0 ? results[0] : null;
  };

  const handleSearch = async () => {
    setLoading(true);
    if (!inputRef.current) {
      return;
    }
    const query = inputRef.current.value;
    const location = await searchLocation(query);
    setLoading(false);
    setSearchQuery('');
    inputRef.current.value = '';
    inputRef.current.focus();
    if (!location) {
      return;
    }
    const newCenter = [parseFloat(location.lon), parseFloat(location.lat)];
    if (mapRef.current) {
      mapRef.current.setCenter(newCenter);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchQuery.length > 0 && event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <TextField
        inputRef={inputRef}
        value={searchQuery}
        variant="outlined"
        placeholder="위치를 입력하세요."
        onKeyDown={handleKeyDown}
        onChange={(event) => setSearchQuery(event.target.value)}
        sx={{ mr: 2 }}
        size='small'
      />
      <Button
        variant="contained"
        onClick={handleSearch}
        disabled={searchQuery.length === 0}
        sx={{
          backgroundColor: '#FFCC80',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#FFB74D',
          },
        }}
      >
        검색
      </Button>
    </Box>
  );
}

export default LocationSearchButton;
