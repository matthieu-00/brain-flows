// Attribution: Based on react-stickies
// Repository: https://github.com/ajainvivek/react-stickies

import React, { useState } from 'react';
import ReactStickies from 'react-stickies';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';

interface StickyNotesWidgetProps {
  widget: Widget;
}

const StickyNotesWidget: React.FC<StickyNotesWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();

  const notes = widget.data?.notes || [];

  const handleNotesChange = (updatedNotes: any[]) => {
    updateWidget(widget.id, {
      data: { ...widget.data, notes: updatedNotes }
    });
  };

  return (
    <div className="bg-white rounded-lg p-4 min-h-64">
      <div className="sticky-notes-wrapper">
        <ReactStickies 
          notes={notes} 
          onChange={handleNotesChange}
        />
      </div>
    </div>
  );
};

export default StickyNotesWidget;