import { Add01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';

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
        <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
        {t('Add Branch')}
      </Button>
    </div>
  );
};

export default BranchesToolbar;
