// Attribution: Based on Sticky-Notes-React
// Repository: https://github.com/divanov11/Sticky-Notes-React

import React, { useState, useRef, useCallback } from 'react';
import { Plus, X, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';

interface StickyNotesWidgetProps {
  widget: Widget;
}

interface StickyNote {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  createdAt: Date;
}

const colors = [
  '#fef3c7', // yellow
  '#fecaca', // red
  '#bfdbfe', // blue
  '#bbf7d0', // green
  '#e9d5ff', // purple
  '#fed7aa', // orange
  '#f3e8ff', // lavender
  '#fce7f3', // pink
];

const StickyNotesWidget: React.FC<StickyNotesWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notes: StickyNote[] = widget.data?.notes || [];

  const addNote = () => {
    const newNote: StickyNote = {
      id: Date.now().toString(),
      content: 'New note...',
      color: selectedColor,
      position: { 
        x: Math.random() * 200, 
        y: Math.random() * 150 
      },
      createdAt: new Date(),
    };

    const updatedNotes = [...notes, newNote];
    updateWidget(widget.id, {
      data: { ...widget.data, notes: updatedNotes }
    });
  };

  const updateNote = (noteId: string, updates: Partial<StickyNote>) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId ? { ...note, ...updates } : note
    );
    updateWidget(widget.id, {
      data: { ...widget.data, notes: updatedNotes }
    });
  };

  const deleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    updateWidget(widget.id, {
      data: { ...widget.data, notes: updatedNotes }
    });
  };

  const handleNoteContentChange = (noteId: string, content: string) => {
    updateNote(noteId, { content });
  };

  const handleNoteDrag = (noteId: string, newPosition: { x: number; y: number }) => {
    updateNote(noteId, { position: newPosition });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Color Picker */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2"
            >
              <Palette className="w-4 h-4" />
            </Button>
            
            {showColorPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-full right-0 mt-2 p-2 bg-white dark:bg-neutral-surface border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg z-20"
              >
                <div className="grid grid-cols-4 gap-1">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setShowColorPicker(false);
                      }}
                      className={`w-6 h-6 rounded border-2 ${
                        selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Add Note Button */}
        <Button
          onClick={addNote}
          size="sm"
          className="flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add Note</span>
        </Button>
      </div>

      {/* Notes Container */}
      <div 
        ref={containerRef}
        className="relative min-h-64 bg-gray-50 dark:bg-neutral-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-700 overflow-hidden"
        style={{ height: '300px' }}
      >
        {notes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-neutral-textMuted">
            <div className="text-center">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm">No sticky notes yet</p>
              <p className="text-xs">Click "Add Note" to create your first note</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {notes.map(note => (
              <StickyNoteComponent
                key={note.id}
                note={note}
                onUpdate={(updates) => updateNote(note.id, updates)}
                onDelete={() => deleteNote(note.id)}
                onDrag={(position) => handleNoteDrag(note.id, position)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Notes Count */}
      <div className="text-xs text-gray-500 dark:text-neutral-textMuted text-center">
        {notes.length} {notes.length === 1 ? 'note' : 'notes'}
      </div>
    </div>
  );
};

interface StickyNoteComponentProps {
  note: StickyNote;
  onUpdate: (updates: Partial<StickyNote>) => void;
  onDelete: () => void;
  onDrag: (position: { x: number; y: number }) => void;
}

const StickyNoteComponent: React.FC<StickyNoteComponentProps> = ({
  note,
  onUpdate,
  onDelete,
  onDrag,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;

    dragStartRef.current = {
      x: e.clientX - note.position.x,
      y: e.clientY - note.position.y,
    };
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const newPosition = {
        x: Math.max(0, Math.min(250, e.clientX - dragStartRef.current.x)),
        y: Math.max(0, Math.min(200, e.clientY - dragStartRef.current.y)),
      };
      onDrag(newPosition);
    },
    [onDrag]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value });
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <motion.div
      ref={noteRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`absolute w-32 h-32 p-2 rounded-lg shadow-md cursor-move select-none ${
        isDragging ? 'z-10 shadow-lg' : 'z-0'
      }`}
      style={{
        backgroundColor: note.color,
        left: note.position.x,
        top: note.position.y,
        transform: isDragging ? 'rotate(5deg)' : 'rotate(0deg)',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 text-white rounded-full hover:bg-red-600"
      >
        <X className="w-3 h-3" />
      </Button>

      {/* Note Content */}
      {isEditing ? (
        <textarea
          value={note.content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          autoFocus
          className="w-full h-full resize-none border-none outline-none bg-transparent text-xs p-1"
          style={{ backgroundColor: 'transparent' }}
        />
      ) : (
        <div className="w-full h-full text-xs p-1 overflow-hidden">
          <div className="break-words">
            {note.content}
          </div>
        </div>
      )}

      {/* Note Footer */}
      <div className="absolute bottom-1 right-1 text-xs opacity-50">
        {isEditing ? '✏️' : '📝'}
      </div>
    </motion.div>
  );
};

export default StickyNotesWidget;