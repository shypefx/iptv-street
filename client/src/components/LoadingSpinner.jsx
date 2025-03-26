import React from 'react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className="spinner"></div>
      <div className="loading-text">{text}</div>
    </div>
  );
};

export default LoadingSpinner;
