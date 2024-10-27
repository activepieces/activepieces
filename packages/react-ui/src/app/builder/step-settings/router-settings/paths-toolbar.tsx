import React from 'react';
import { Plus, Trash } from 'lucide-react';
import { t } from 'i18next';
import { Button } from '../../../../components/ui/button';

interface PathsToolbarProps {
  showDeleteButton: boolean;
  addButtonClicked: () => void;
  deleteButtonClicked: () => void;
}

const PathsToolbar: React.FC<PathsToolbarProps> = ({
  showDeleteButton,
  addButtonClicked,
  deleteButtonClicked,
}) => {
  return (
    <div className="flex items-center gap-2 justify-end mb-2">
      <Button
        variant={'basic'}
        className="gap-1 items-center"
        onClick={addButtonClicked}
      >
        <Plus className="w-4 h-4"></Plus>
        {t('Add Path')}
      </Button>

      {showDeleteButton && (
        <Button
          variant={'basic'}
          className="text-destructive gap-1 items-center"
          size={'sm'}
          onClick={deleteButtonClicked}
        >
          <Trash className="w-4 h-4"></Trash>
          {t('Delete Path')}
        </Button>
      )}
    </div>
  );
};

export default PathsToolbar;
