import React, { useState, useRef, useEffect } from 'react';
import type { StickyNote as StickyNoteType } from '../types';

interface StickyNoteProps {
  note: StickyNoteType;
  scale: number;
  onUpdate: (noteId: string, updates: Partial<StickyNoteType>) => void;
  onDelete: (noteId: string) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({ note, scale, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    console.log('StickyNote: handleSave called');
    onUpdate(note.id, { text: editText });
    setIsEditing(false);
  };

  const handleCancel = () => {
    console.log('StickyNote: handleCancel called');
    setEditText(note.text);
    setIsEditing(false);
  };

  const handleToggleExpanded = () => {
    console.log('StickyNote: handleToggleExpanded called');
    onUpdate(note.id, { isExpanded: !note.isExpanded });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      className="sticky-note"
      style={{
        position: 'absolute',
        left: `${note.x * scale}px`,
        top: `${note.y * scale}px`,
        zIndex: 20,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Sticky Note Icon */}
      <div
        className="sticky-note-icon"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          console.log('StickyNote icon clicked');
          handleToggleExpanded();
        }}
        title={note.text || 'Empty note'}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 3V18C3 19.1046 3.89543 20 5 20H16L21 15V5C21 3.89543 20.1046 3 19 3H3Z"
            fill="#ffd700"
            stroke="#e6c200"
            strokeWidth="1"
          />
          <path
            d="M16 20V15H21"
            fill="none"
            stroke="#e6c200"
            strokeWidth="1"
          />
          <circle cx="12" cy="8" r="1.5" fill="#333" />
          <circle cx="12" cy="12" r="1.5" fill="#333" />
          <circle cx="12" cy="16" r="1.5" fill="#333" />
        </svg>
      </div>

      {/* Expanded Content */}
      {note.isExpanded && (
        <div 
          className="sticky-note-popup"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <div className="sticky-note-editor">
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="Write your comment..."
                rows={3}
              />
              <div className="sticky-note-buttons">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }} 
                  className="save-btn"
                >
                  Save
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="sticky-note-content">
              <div className="sticky-note-text">
                {note.text || <em>Click to add comment</em>}
              </div>
              <div className="sticky-note-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Edit button clicked');
                    setIsEditing(true);
                  }}
                  className="edit-btn"
                  title="Edit comment"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Delete button clicked');
                    onDelete(note.id);
                  }}
                  className="delete-btn"
                  title="Delete comment"
                >
                  🗑️
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StickyNote;
