import React from 'react';
import type { AnnotationType, HighlightColor } from '../types';

interface AnnotationToolbarProps {
  onApply: (type: AnnotationType) => void;
  selectedHighlightColor: HighlightColor;
  onColorChange: (color: HighlightColor) => void;
}

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  { name: 'Yellow', value: 'rgba(255, 255, 0, 0.5)' },
  { name: 'Green', value: 'rgba(0, 255, 0, 0.5)' },
  { name: 'Blue', value: 'rgba(0, 123, 255, 0.5)' },
  { name: 'Pink', value: 'rgba(255, 20, 147, 0.5)' },
  { name: 'Orange', value: 'rgba(255, 165, 0, 0.5)' },
  { name: 'Purple', value: 'rgba(128, 0, 128, 0.5)' },
];

const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({ onApply, selectedHighlightColor, onColorChange }) => {
  return (
    <>
      <li className="px-3 py-2 border-b border-gray-200">
        <div className="text-xs font-medium text-gray-600 mb-2">Highlight Color</div>
        <div className="flex flex-wrap gap-1">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.name}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-150 ${
                selectedHighlightColor.name === color.name
                  ? 'border-gray-600 scale-110'
                  : 'border-gray-300 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => onColorChange(color)}
              title={color.name}
            />
          ))}
        </div>
      </li>

      <li
        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer rounded-md transition-colors duration-150 ease-in-out"
        onClick={() => onApply('highlight')}
      >
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded mr-2 border border-gray-300"
            style={{ backgroundColor: selectedHighlightColor.value }}
          />
          Highlight
        </div>
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
