import React from 'react';
import type { StickyNote } from '../types';

interface StickyNoteListProps {
  notes: StickyNote[];
  onNoteClick: (noteId: string) => void;
  onNoteDelete: (noteId: string) => void;
}

const StickyNoteList: React.FC<StickyNoteListProps> = ({ notes, onNoteClick, onNoteDelete }) => {
  const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (notes.length === 0) {
    return (
      <div className="sticky-note-list-empty">
        <p className="text-gray-500 text-sm">No comments yet</p>
        <p className="text-gray-400 text-xs">Click anywhere on the PDF to add a sticky note</p>
      </div>
    );
  }

  return (
    <div className="sticky-note-list">
      <div className="sticky-note-list-header">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Comments ({notes.length})
        </h3>
      </div>
      <div className="sticky-note-list-items">
        {sortedNotes.map((note) => (
          <div
            key={note.id}
            className="sticky-note-list-item"
            onClick={() => onNoteClick(note.id)}
          >
            <div className="sticky-note-list-content">
              <div className="sticky-note-list-text">
                {note.text ? truncateText(note.text) : <em>Empty comment</em>}
              </div>
              <div className="sticky-note-list-meta">
                <span className="page-number">Page {note.page}</span>
                <span className="timestamp">{formatDate(note.timestamp)}</span>
              </div>
            </div>
            <button
              className="sticky-note-list-delete"
              onClick={(e) => {
                e.stopPropagation();
                onNoteDelete(note.id);
              }}
              title="Delete comment"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StickyNoteList;
