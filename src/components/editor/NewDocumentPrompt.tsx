import React from 'react';
import { UnsavedChangesPrompt } from './UnsavedChangesPrompt';

interface NewDocumentPromptProps {
  isOpen: boolean;
  onSaveAndNew: () => void;
  onExportAndNew: () => void;
  onDiscardAndNew: () => void;
  onCancel: () => void;
}

export const NewDocumentPrompt: React.FC<NewDocumentPromptProps> = ({
  isOpen,
  onSaveAndNew,
  onExportAndNew,
  onDiscardAndNew,
  onCancel,
}) => {
  return (
    <UnsavedChangesPrompt
      isOpen={isOpen}
      title="Start a new document?"
      description="You have unsaved changes. What would you like to do before starting fresh?"
      continueLabel="start new"
      onSaveAndContinue={onSaveAndNew}
      onExportAndContinue={onExportAndNew}
      onDiscardAndContinue={onDiscardAndNew}
      onCancel={onCancel}
    />
  );
};
