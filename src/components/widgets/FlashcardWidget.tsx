// Attribution: Based on react-quizlet-flashcard
// Repository: https://github.com/ABSanthosh/react-quizlet-flashcard

import React, { useState } from 'react';
import { Plus, X, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget, Flashcard } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FlashcardWidgetProps {
  widget: Widget;
}

const FlashcardWidget: React.FC<FlashcardWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  const flashcards: Flashcard[] = widget.data?.flashcards || [];

  const addFlashcard = () => {
    if (!newFront.trim() || !newBack.trim()) return;

    const newCard: Flashcard = {
      id: Date.now(),
      front: { html: <div className="text-center p-4">{newFront}</div> },
      back: { html: <div className="text-center p-4">{newBack}</div> },
    };

    const updatedCards = [...flashcards, newCard];
    updateWidget(widget.id, {
      data: { ...widget.data, flashcards: updatedCards }
    });

    setNewFront('');
    setNewBack('');
  };

  const removeFlashcard = (cardId: number) => {
    const updatedCards = flashcards.filter(card => card.id !== cardId);
    updateWidget(widget.id, {
      data: { ...widget.data, flashcards: updatedCards }
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit3 className="w-4 h-4 mr-1" />
          {isEditing ? 'Done' : 'Edit'}
        </Button>
      </div>

      {/* Add New Card Form */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 p-4 bg-gray-50 rounded-lg"
          >
            <Input
              placeholder="Front of card..."
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
            />
            <Input
              placeholder="Back of card..."
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
            />
            <Button
              onClick={addFlashcard}
              disabled={!newFront.trim() || !newBack.trim()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Flashcard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashcard Display */}
      {flashcards.length > 0 ? (
        <div className="space-y-4">
          {/* Card Management */}
          {isEditing && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Manage Cards:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {flashcards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <span className="text-sm truncate flex-1">
                      {typeof card.front.html === 'string' ? card.front.html : 'Card'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFlashcard(card.id)}
                      className="p-1 text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simple Flashcard Display */}
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">🃏</div>
            <p className="text-sm">{flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} created</p>
            <p className="text-xs mt-1">Interactive flashcard viewer coming soon</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">🃏</div>
          <p className="text-sm mb-2">No flashcards yet</p>
          <p className="text-xs">Click Edit to add your first flashcard</p>
        </div>
      )}
    </div>
  );
};

export default FlashcardWidget;