import {
  Cancel01Icon,
  Delete02Icon,
  Download04Icon,
  FolderTransferIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { AnimatePresence, motion } from 'motion/react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { LoadingSpinner } from '@/components/custom/spinner';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';

type AutomationsSelectionBarProps = {
  selectedCount: number;
  isDeleting: boolean;
  isMoving: boolean;
  isExporting: boolean;
  hasMovableOrExportableItems: boolean;
  onMoveClick: () => void;
  onDeleteClick: () => void;
  onExportClick: () => void;
  onClearSelection: () => void;
};

export const AutomationsSelectionBar = ({
  selectedCount,
  isDeleting,
  isMoving,
  isExporting,
  hasMovableOrExportableItems,
  onMoveClick,
  onDeleteClick,
  onExportClick,
  onClearSelection,
}: AutomationsSelectionBarProps) => {
  const { embedState } = useEmbedding();

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 bg-gray-1 border rounded-lg shadow-lg p-2">
            {!embedState.hideFolders && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveClick}
                disabled={isMoving || !hasMovableOrExportableItems}
              >
                <HugeiconsIcon
                  icon={FolderTransferIcon}
                  className="h-4 w-4 mr-1"
                />
                {t('Move to')}
              </Button>
            )}
            {!embedState.hideExportAndImportFlow && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportClick}
                disabled={isExporting || !hasMovableOrExportableItems}
              >
                {isExporting ? (
                  <LoadingSpinner className="size-4 mr-2" />
                ) : (
                  <HugeiconsIcon
                    icon={Download04Icon}
                    className="size-4 mr-2"
                  />
                )}
                {isExporting ? t('Exporting') : t('Export')}
              </Button>
            )}
            <ConfirmationDeleteDialog
              title={t('Delete Selected Items')}
              message={t(
                'This will permanently delete {count} selected items. This action cannot be undone.',
                { count: selectedCount },
              )}
              mutationFn={async () => onDeleteClick()}
              entityName={t('items')}
              buttonText={t('Delete')}
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-11 hover:text-danger-11"
                disabled={isDeleting}
                data-testid="automations-bulk-delete"
              >
                <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4 mr-1" />
                {t('Delete')}
              </Button>
            </ConfirmationDeleteDialog>
            <div className="border-l h-6 mx-1" />
            <span className="text-sm text-gray-11">
              {t('{count} selected', { count: selectedCount })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClearSelection}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
