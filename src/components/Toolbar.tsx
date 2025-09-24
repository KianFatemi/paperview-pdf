import React from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface ToolbarProps {
  setPdfData: (data: Uint8Array | null) => void;
  setPdfDocument: (document: pdfjsLib.PDFDocumentProxy | null) => void;
  handleZoomIn: () => void; 
  handleZoomOut: () => void; 
  handleFitToScreen: () => void; 
  onOpenSearch: () => void;
  onOpenPageManager: () => void;
  zoomLevel: number;
  stickyNoteMode: boolean;
  onToggleStickyNoteMode: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ setPdfData, setPdfDocument, handleZoomIn, handleZoomOut, handleFitToScreen, onOpenSearch, onOpenPageManager, zoomLevel, stickyNoteMode, onToggleStickyNoteMode }) => {
  
  const handleOpenFile = async () => {
    try {
      const fileArray: Uint8Array | null = await window.electronAPI.openFile();
      
      if (fileArray) {
        setPdfData(fileArray);
        
        try {
          const loadingTask = pdfjsLib.getDocument(fileArray);
          const pdfDoc = await loadingTask.promise;
          setPdfDocument(pdfDoc);
        } catch (error) {
          console.error('Failed to load PDF document:', error);
          setPdfDocument(null);
        }
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
          onClick={handleZoomOut}
          className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          -
        </button>
        <div className="px-3 py-2 bg-gray-800 text-white rounded-md border border-gray-600 min-w-[70px] text-center text-sm font-mono">
          {Math.round(zoomLevel * 100)}%
        </div>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          +
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
        <button
          onClick={onOpenPageManager}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 flex items-center gap-2"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
            />
          </svg>
          Manage Pages
        </button>
        <button
          onClick={onToggleStickyNoteMode}
          className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 flex items-center gap-2 ${
            stickyNoteMode 
              ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
              : 'bg-gray-600 text-white hover:bg-gray-500'
          }`}
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" 
            />
          </svg>
          {stickyNoteMode ? 'Exit Note Mode' : 'Sticky Note'}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;