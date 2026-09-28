import { Delete02Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useContext } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

import { FieldHeaderContext } from '../utils/utils';

import { useTableState } from './ap-table-state-provider';
import RenameFieldPopoverContent from './rename-field-popovercontent';

export enum FieldActionType {
  DELETE,
  RENAME,
}

const ApFieldActionMenuItemRenderer = ({
  action,
}: {
  action: FieldActionType;
}) => {
  const fieldHeaderContext = useContext(FieldHeaderContext);
  const deleteField = useTableState((state) => state.deleteField);

  if (!fieldHeaderContext) {
    console.error('FieldHeaderContext not found');
    return null;
  }
  const { field, setIsPopoverOpen, setPopoverContent } = fieldHeaderContext;

  switch (action) {
    case FieldActionType.DELETE:
      return (
        <ConfirmationDeleteDialog
          title={t('Delete Field')}
          message={t(
            'This field and all its data will be permanently deleted.',
          )}
          mutationFn={async () => {
            await deleteField(field.index);
          }}
          entityName={t('field')}
          buttonText={t('Delete')}
        >
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setPopoverContent(null);
              setIsPopoverOpen(false);
            }}
            className="flex items-center gap-2 text-danger-11 cursor-pointer"
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              className="h-4 w-4 text-danger-11"
            />
            <span className="text-danger-11">{t('Delete')}</span>
          </DropdownMenuItem>
        </ConfirmationDeleteDialog>
      );
    case FieldActionType.RENAME:
      return (
        <DropdownMenuItem
          onSelect={() => {
            setPopoverContent(<RenameFieldPopoverContent name={field.name} />);
            //this is needed because the popover is not open when the content is set
            // so we need to wait for the next frame to open it
            requestAnimationFrame(() => {
              setIsPopoverOpen(true);
            });
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4 " />
          <span>{t('Rename')}</span>
        </DropdownMenuItem>
      );
    default:
      return null;
  }
};

ApFieldActionMenuItemRenderer.displayName = 'ApFieldActionMenuItemRenderer';
export default ApFieldActionMenuItemRenderer;
