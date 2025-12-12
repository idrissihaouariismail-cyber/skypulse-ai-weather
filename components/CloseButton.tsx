import React from "react";

export default function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute top-4 left-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
      aria-label="Close"
    >
      <svg
        className="w-6 h-6 text-white"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

