import React from 'react';

interface RadarPreviewProps {
  title?: string;
  description?: string;
}

/**
 * RadarPreview Component
 * Displays a circular radar graphic with rotating animation
 */
const RadarPreview: React.FC<RadarPreviewProps> = ({ 
  title = "Radar Preview",
  description = "Rotating animation showing weather patterns"
}) => {
  return (
    <div className="bg-transparent">
      {/* Circular Radar Graphic */}
      <div className="relative w-full aspect-square max-w-[200px] mx-auto mb-3">
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Concentric circles */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="#374151" strokeWidth="1" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#374151" strokeWidth="1" />
          <circle cx="100" cy="100" r="30" fill="none" stroke="#374151" strokeWidth="1" />
          
          {/* Center point */}
          <circle cx="100" cy="100" r="3" fill="#6B7280" />
          
          {/* Rotating wedge (yellow/gold) */}
          <g style={{ transformOrigin: '100px 100px', animation: 'spin 4s linear infinite' }}>
            <path
              d="M 100 100 L 100 10 A 90 90 0 0 1 190 100 Z"
              fill="#FCD34D"
              fillOpacity="0.6"
            />
          </g>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </svg>
      </div>
    </div>
  );
};

export default RadarPreview;

