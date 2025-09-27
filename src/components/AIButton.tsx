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
      <div className="text-lg font-bold">
        ✨
      </div>
      
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
