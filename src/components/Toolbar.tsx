import React, { useState, useRef, useEffect } from 'react';
import { HIGHLIGHT_COLORS } from './AnnotationToolbar';
import type { AnnotationType, HighlightColor } from '../types';

interface ToolbarProps {
  handleZoomIn: () => void; 
  handleZoomOut: () => void; 
  handleFitToScreen: () => void; 
  onOpenSearch: () => void;
  onOpenPageManager: () => void;
  zoomLevel: number;
  stickyNoteMode: boolean;
  onToggleStickyNoteMode: () => void;
  selectedHighlightColor: HighlightColor;
  onColorChange: (color: HighlightColor) => void;
  onApplyAnnotation: (type: AnnotationType) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ handleZoomIn, handleZoomOut, handleFitToScreen, onOpenSearch, onOpenPageManager, zoomLevel, stickyNoteMode, onToggleStickyNoteMode, selectedHighlightColor, onColorChange, onApplyAnnotation }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  return (
    <div className="p-2 bg-gray-700 shadow-md flex items-center gap-4">
      <div className="flex items-center space-x-2 border-r border-gray-600 pr-4">
        <div className="relative" ref={colorPickerRef}>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1"
            title="Highlight Color"
          >
            <div 
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: selectedHighlightColor.value }}
            />
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showColorPicker && (
            <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-xl p-3 z-50 min-w-[200px]">
              <div className="text-xs font-medium text-gray-700 mb-2">Highlight Color</div>
              <div className="grid grid-cols-3 gap-2">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    className={`w-12 h-12 rounded-md border-2 transition-all duration-150 flex items-center justify-center ${
                      selectedHighlightColor.name === color.name
                        ? 'border-blue-500 scale-105'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => {
                      onColorChange(color);
                      setShowColorPicker(false);
                    }}
                    title={color.name}
                  >
                    {selectedHighlightColor.name === color.name && (
                      <svg className="w-6 h-6 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={() => onApplyAnnotation('highlight')}
          className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
          title="Highlight selected text"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          <span className="text-sm">Highlight</span>
        </button>
        
        <button
          onClick={() => onApplyAnnotation('underline')}
          className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
          title="Underline selected text"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 5v6a5 5 0 0010 0V5M5 19h14" />
          </svg>
          <span className="text-sm">Underline</span>
        </button>
        
        <button
          onClick={() => onApplyAnnotation('strikethrough')}
          className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
          title="Strikethrough selected text"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M9 5v14M15 5v14" />
          </svg>
          <span className="text-sm">Strikethrough</span>
        </button>
      </div>
      
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