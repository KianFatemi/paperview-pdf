import React from 'react';
import type { AnnotationType, Rect } from '../types';

interface AnnotationProps {
  type: AnnotationType;
  rect: Rect;
  scale: number;
  color: string;
}

const THICKNESS = 0.3;  

const Annotation: React.FC<AnnotationProps> = ({ type, rect, scale, color }) => {
  const scaledThickness = THICKNESS * scale;
  let style: React.CSSProperties = {
    position: 'absolute',
    left: `${rect.x * scale}px`,
    top: `${rect.y * scale}px`,
    width: `${rect.width * scale}px`,
    height: `${rect.height * scale}px`,
  };

  if (type === 'highlight') {
    style = { ...style, backgroundColor: color };
  } else if (type === 'underline') {
    style = {
      ...style,
      borderBottom: `${scaledThickness}px solid ${color}`,
      background: 'none',
    };
  } else if (type === 'strikethrough') {
    style = {
      ...style,
      top: `${(rect.y + (rect.height / 2) - (THICKNESS / 2)) * scale}px`,
      height: `${scaledThickness}px`,
      backgroundColor: color,
    };
  }

  return <div className={`annotation-${type}`} style={style} />;
};

export default Annotation;
