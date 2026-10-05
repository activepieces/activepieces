import { t } from 'i18next';
import { Download, FolderInput, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { LoadingSpinner } from '@/components/custom/spinner';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type AutomationsSelectionBarProps = {
  selectedCount: number;
  isDeleting: boolean;
  isMoving: boolean;
  isExporting: boolean;
  hasMovableItems: boolean;
  hasExportableItems: boolean;
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
  hasMovableItems,
  hasExportableItems,
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
          <div className="flex items-center gap-1 rounded-2xl border bg-panel p-1 shadow-over">
            {!embedState.hideFolders && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveClick}
                disabled={isMoving || !hasMovableItems}
              >
                <FolderInput />
                {t('Move to')}
              </Button>
            )}
            {!embedState.hideExportAndImportFlow && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportClick}
                disabled={isExporting || !hasExportableItems}
              >
                {isExporting ? (
                  <LoadingSpinner className="size-4" />
                ) : (
                  <Download />
                )}
                {isExporting ? t('Exporting') : t('Export')}
              </Button>
            )}
            <ConfirmDialog
              title={t('Delete Selected Items')}
              description={t(
                'This will permanently delete {count} selected items. This action cannot be undone.',
                { count: selectedCount },
              )}
              onConfirm={async () => onDeleteClick()}
              onError={(error) =>
                toast.error(
                  api.extractServerErrorMessage(
                    error,
                    t('Failed to delete items'),
                  ),
                )
              }
              confirmLabel={t('Delete')}
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-11 hover:text-danger-11"
                disabled={isDeleting}
              >
                <Trash2 />
                {t('Delete')}
              </Button>
            </ConfirmDialog>
            <div className="h-6 w-px bg-gray-6" />
            <span className="px-2 text-sm text-gray-11 tabular-nums">
              {t('{count} selected', { count: selectedCount })}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={onClearSelection}>
              <X />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
