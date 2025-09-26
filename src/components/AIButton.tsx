import React from 'react';

interface AIButtonProps {
  isOpen: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const AIButton: React.FC<AIButtonProps> = ({ isOpen, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
        ${disabled 
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
          : isOpen 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
        }
      `}
      title={disabled ? 'AI Assistant (API key required)' : isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      >
        <path d="M9 18l6-6-6-6"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6"/>
        <path d="m5.64 7.64 4.24 4.24m4.24 0 4.24-4.24"/>
        <path d="m7.64 18.36 4.24-4.24m4.24 0 4.24 4.24"/>
      </svg>
      
      <div className={`
        absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-200
        ${disabled 
          ? 'bg-gray-500' 
          : 'bg-green-400 animate-pulse'
        }
      `} />
    </button>
  );
};

export default AIButton;
