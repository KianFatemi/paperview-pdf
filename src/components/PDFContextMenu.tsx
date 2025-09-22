import React from 'react';
import AnnotationToolbar from './AnnotationToolbar';
import type { AnnotationType } from '../types';

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  onCopy: () => void;
  onApplyAnnotation: (type: AnnotationType) => void; 
}

const PDFContextMenu: React.FC<Props> = ({ x, y, onClose, onCopy, onApplyAnnotation }) => {
  const selectionRef = React.useRef<Selection | null>(null);
  const rangeRef = React.useRef<Range | null>(null);

  React.useEffect(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selectionRef.current = selection;
      rangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  }, []);

  const handleApply = (type: AnnotationType) => {
    
    if (selectionRef.current && rangeRef.current) {
      selectionRef.current.removeAllRanges();
      selectionRef.current.addRange(rangeRef.current);
    }
    onApplyAnnotation(type);
    onClose();
  };

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[120px] overflow-hidden backdrop-blur-sm"
      style={{ 
        top: y, 
        left: x,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      <ul className="m-0 p-1 list-none">
        <li
          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer rounded-md transition-colors duration-150 ease-in-out"
          onClick={() => {
            onCopy();
            onClose();
          }}
        >
          <svg 
            className="w-4 h-4 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
            />
          </svg>
          Copy
        </li>
        
        <AnnotationToolbar onApply={handleApply} />
      </ul>
    </div>
  );
};

export default PDFContextMenu;
