// src/components/DebugInfo.jsx
import React from 'react';

export default function DebugInfo({ data, title = "Debug Info" }) {
  return (
    <div style={{
        background: '#141010',
              border: "1px solid #dee2e6",
      borderRadius: "4px",
      padding: "10px",
      margin: "10px 0",
      fontSize: "12px",
      fontFamily: "monospace",
      whiteSpace: "pre-wrap",
      maxHeight: "300px",
      overflow: "auto"
    }}>
      <h4 style={{ margin: "0 0 8px 0" }}>{title}</h4>
      <pre style={{ margin: 0 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
