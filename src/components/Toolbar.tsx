import React from 'react';

interface ToolbarProps {
  setPdfData: (data: Uint8Array | null) => void;
  handleZoomIn: () => void; 
  handleZoomOut: () => void; 
  handleFitToScreen: () => void; 
  onOpenSearch: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ setPdfData, handleZoomIn, handleZoomOut, handleFitToScreen, onOpenSearch }) => {
  
  const handleOpenFile = async () => {
    try {
      const fileArray: Uint8Array | null = await window.electronAPI.openFile();
      
      if (fileArray) {
        setPdfData(fileArray);
      }
    } catch (error) {
      console.error("Failed to open or read file:", error);
    }
  };

  return (
    <div className="p-2 bg-gray-700 shadow-md flex items-center gap-4">
      <button
        onClick={handleOpenFile}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
      >
        Open PDF
      </button>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          -
        </button>
        <button
          onClick={handleFitToScreen}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Fit to Screen
        </button>
        <button
          onClick={onOpenSearch}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default Toolbar;