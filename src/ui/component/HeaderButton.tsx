import React from 'react';

interface HeaderButtonProps {
  onClick: () => void;
  disabled: boolean;
  label: string;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({ onClick, disabled, label }) => (
  <button type="button" onClick={onClick} className="button" disabled={disabled}>
    {label}
  </button>
);

export default HeaderButton;
