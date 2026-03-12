// Attribution: Based on flatdraw
// Repository: https://github.com/diogocapela/flatdraw

import React from 'react';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import FlatDraw from '../external/flatdraw';

interface DrawingCanvasWidgetProps {
  widget: Widget;
}

const DrawingCanvasWidget: React.FC<DrawingCanvasWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();

  const handleSave = (dataUrl: string) => {
    updateWidget(widget.id, {
      data: { ...widget.data, drawing: dataUrl }
    });
  };

  const savedDrawing = widget.data?.drawing;

  return (
    <div className="bg-white dark:bg-neutral-surface rounded-lg p-4">
      <FlatDraw
        width={350}
        height={250}
        onSave={handleSave}
        initialData={savedDrawing}
        className="w-full"
      />
    </div>
  );
};

export default DrawingCanvasWidget;