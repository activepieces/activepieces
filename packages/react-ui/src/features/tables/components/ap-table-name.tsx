import { useMutation } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';

import EditableText from '@/components/ui/editable-text';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';
import { Permission } from '@activepieces/shared';

import { tablesApi } from '../lib/tables-api';

import { useTableState } from './ap-table-state-provider';

type ApTableNameProps = {
  tableName: string;
  isEditingTableName: boolean;
  setIsEditingTableName: (val: boolean) => void;
};

const ApTableName = ({
  tableName,
  isEditingTableName,
  setIsEditingTableName,
}: ApTableNameProps) => {
  const renameTable = useTableState((state) => state.renameTable);
  const tableId = useTableState((state) => state.table?.id);
  const { mutate: updateTable } = useMutation({
    mutationFn: (newName: string) =>
      tablesApi.update(tableId, { name: newName }),
    onSuccess: () => {},
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
        className="text-2xl font-bold"
        value={tableName}
        readonly={isReadOnly}
        onValueChange={(newName) => {
          renameTable(newName);
          updateTable(newName);
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
