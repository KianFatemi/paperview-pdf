import React from 'react';
import Annotation from './Annotation';
import type { Annotation as AnnotationInterface } from '../types';

interface AnnotationLayerProps {
  annotations: AnnotationInterface[];
  scale: number;
}

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ annotations, scale }) => {
  return (
    <div className="pdf-layer__annotation">
      {annotations.flatMap((ann) =>
        ann.rects.map((rect, i) => (
          <Annotation key={`${ann.id}-${i}`} type={ann.type} rect={rect} scale={scale} color={ann.color} />
        ))
      )}
    </div>
  );
};

export default AnnotationLayer;
