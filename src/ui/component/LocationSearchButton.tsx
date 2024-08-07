import React from 'react';
import { LocationSearchButtonProps } from '../types';

const LocationSearchButton = ({ mapRef, inputRef, nodes, setLoading }: LocationSearchButtonProps) => {
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
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-container">
      <input
        disabled={nodes.length === 0}
        ref={inputRef}
        className="search-input"
        type="text"
        placeholder="위치를 입력하세요."
        onKeyDown={handleKeyDown}
      />
      <button
        disabled={nodes.length === 0}
        className="search-button"
        type="button"
        onClick={handleSearch}
      >검색</button>
    </div>
  )
}

export default LocationSearchButton;
