import { t } from 'i18next';
import { Plus } from 'lucide-react';
import React from 'react';

import { Button } from '../../../../components/ui/button';

interface BranchesToolbarProps {
  addButtonClicked: () => void;
}

const BranchesToolbar: React.FC<BranchesToolbarProps> = ({
  addButtonClicked,
}) => {
  return (
    <div className="flex items-center gap-2 justify-end mb-2">
      <Button
        variant={'basic'}
        className="gap-1 items-center"
        onClick={addButtonClicked}
      >
        <Plus className="w-4 h-4"></Plus>
        {t('Add Branch')}
      </Button>
    </div>
  );
};

export default BranchesToolbar;
