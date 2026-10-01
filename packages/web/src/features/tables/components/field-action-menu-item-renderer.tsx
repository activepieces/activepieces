import { t } from 'i18next';
import { Pencil, Trash } from 'lucide-react';
import { useContext } from 'react';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
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
        <ConfirmDialog
          title={t('Delete Field')}
          description={t(
            'This field and all its data will be permanently deleted.',
          )}
          onConfirm={async () => {
            await deleteField(field.index);
          }}
          confirmLabel={t('Delete')}
        >
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setPopoverContent(null);
              setIsPopoverOpen(false);
            }}
            className="flex items-center gap-2 text-danger-11 cursor-pointer"
          >
            <Trash className="text-danger-11" />
            <span className="text-danger-11">{t('Delete')}</span>
          </DropdownMenuItem>
        </ConfirmDialog>
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
          <Pencil />
          <span>{t('Rename')}</span>
        </DropdownMenuItem>
      );
    default:
      return null;
  }
};

ApFieldActionMenuItemRenderer.displayName = 'ApFieldActionMenuItemRenderer';
export default ApFieldActionMenuItemRenderer;
