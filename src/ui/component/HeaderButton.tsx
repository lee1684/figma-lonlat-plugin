import React from 'react';
import { HeaderButtonProps } from '../types';

const HeaderButton: React.FC<HeaderButtonProps> = ({ onClick, disabled, label }) => (
  <button type="button" onClick={onClick} className="button" disabled={disabled}>
    {label}
  </button>
);

export default HeaderButton;
