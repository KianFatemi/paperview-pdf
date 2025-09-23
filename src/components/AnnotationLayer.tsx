import React from 'react';
import Annotation from './Annotation';
import StickyNote from './StickyNote';
import type { Annotation as AnnotationInterface, StickyNote as StickyNoteType } from '../types';

interface AnnotationLayerProps {
  annotations: AnnotationInterface[];
  stickyNotes: StickyNoteType[];
  scale: number;
  onStickyNoteUpdate: (noteId: string, updates: Partial<StickyNoteType>) => void;
  onStickyNoteDelete: (noteId: string) => void;
}

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ 
  annotations, 
  stickyNotes, 
  scale, 
  onStickyNoteUpdate, 
  onStickyNoteDelete 
}) => {
  return (
    <div className="pdf-layer__annotation">
      {annotations.flatMap((ann) =>
        ann.rects.map((rect, i) => (
          <Annotation key={`${ann.id}-${i}`} type={ann.type} rect={rect} scale={scale} color={ann.color} />
        ))
      )}
      
      {stickyNotes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          scale={scale}
          onUpdate={onStickyNoteUpdate}
          onDelete={onStickyNoteDelete}
        />
      ))}
    </div>
  );
};

export default AnnotationLayer;
