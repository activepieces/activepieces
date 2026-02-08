import { t } from 'i18next';
import { Download, FolderInput, Trash2, X } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';

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
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-background border rounded-lg shadow-lg px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onMoveClick}
          disabled={isMoving || !hasMovableOrExportableItems}
        >
          <FolderInput className="h-4 w-4 mr-1" />
          {t('Move to')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportClick}
          disabled={isExporting || !hasMovableOrExportableItems}
        >
          {isExporting ? (
            <LoadingSpinner className="size-4 mr-2" />
          ) : (
            <Download className="size-4 mr-2" />
          )}
          {isExporting ? t('Exporting') : t('Export')}
        </Button>
        <ConfirmationDeleteDialog
          title={t('Delete Selected Items')}
          message={t(
            'Are you sure you want to delete {count} selected items? This action cannot be undone.',
            { count: selectedCount },
          )}
          mutationFn={async () => onDeleteClick()}
          entityName={t('items')}
        >
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t('Delete')}
          </Button>
        </ConfirmationDeleteDialog>
        <div className="border-l h-6 mx-1" />
        <span className="text-sm text-muted-foreground">
          {t('{count} selected', { count: selectedCount })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
