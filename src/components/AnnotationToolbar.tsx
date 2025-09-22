import React from 'react';
import type { AnnotationType } from '../types';

interface AnnotationToolbarProps {
  onApply: (type: AnnotationType) => void;
}

const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({ onApply }) => {
  return (
    <>
      <li
        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer rounded-md transition-colors duration-150 ease-in-out"
        onClick={() => onApply('highlight')}
      >
        Highlight
      </li>
      <li
        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer rounded-md transition-colors duration-150 ease-in-out"
        onClick={() => onApply('underline')}
      >
        Underline
      </li>
      <li
        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer rounded-md transition-colors duration-150 ease-in-out"
        onClick={() => onApply('strikethrough')}
      >
        Strikethrough
      </li>
    </>
  );
};

export default AnnotationToolbar;
