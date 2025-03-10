import { useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';

import EditableText from '@/components/ui/editable-text';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';
import { Permission } from '@activepieces/shared';

import { tableHooks } from '../lib/ap-tables-hooks';

import { useTableState } from './ap-table-state-provider';

const ApTableName = ({
  tableId,
  tableName,
  isEditingTableName,
  setIsEditingTableName,
}: {
  tableId: string;
  tableName: string;
  isEditingTableName: boolean;
  setIsEditingTableName: (val: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const enqueueMutation = useTableState((state) => state.enqueueMutation);
  const updateTableMutation = tableHooks.useUpdateTable({
    queryClient,
    tableId,
  });
  const isReadOnly = !useAuthorization().checkAccess(Permission.WRITE_TABLE);

  return (
    <div
      onClick={() => {
        if (!isReadOnly && !isEditingTableName) {
          setIsEditingTableName(true);
        }
      }}
      className={cn('flex items-center gap-2')}
    >
      <EditableText
       className='text-xl font-bold'
        value={tableName}
        readonly={isReadOnly}
        onValueChange={(newName) => {
          enqueueMutation(updateTableMutation, {
            name: newName,
          });
        }}
        isEditing={isEditingTableName}
        setIsEditing={setIsEditingTableName}
      />
      {!isReadOnly && !isEditingTableName && <Pencil className="w-4 h-4" />}
    </div>
  );
};

ApTableName.displayName = 'ApTableName';

export default ApTableName;
