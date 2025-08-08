import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { ReactNode } from 'react';
import { Column, RenderCellProps } from 'react-data-grid';

import {
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  ApFlagId,
  isNil,
  Permission,
  PlatformUsageMetric,
} from '@activepieces/shared';

import { ClientRecordData } from '../lib/store/ap-tables-client-state';
import { Row } from '../lib/types';

import { ApFieldHeader } from './ap-field-header';
import { useTableState } from './ap-table-state-provider';
import { EditableCell } from './editable-cell';
import { NewFieldPopup } from './new-field-popup';
import { SelectCell, SelectHeaderCell } from './select-column';

export function useTableColumns(createEmptyRecord: () => void) {
  const [fields, setSelectedAgentRunId] = useTableState((state) => [
    state.fields,
    state.setSelectedAgentRunId,
  ]);

  const { data: maxFields } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FIELDS_PER_TABLE,
  );

  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const isAllowedToCreateField =
    userHasTableWritePermission && maxFields && fields.length < maxFields;

  const newFieldColumn: Column<Row, { id: string }> = {
    key: 'new-field',
    minWidth: 67,
    maxWidth: 67,
    width: 67,
    name: '',
    renderHeaderCell: () => <AddFieldButton />,
    renderCell: () => <div className="empty-cell"></div>,
  };

  const columns: Column<Row, { id: string }>[] = [
    {
      key: 'select-row',
      name: 'Select',
      width: 66,
      minWidth: 66,
      maxWidth: 66,
      resizable: false,
      sortable: false,
      frozen: true,
      renderHeaderCell: () => <SelectHeaderCell />,
      renderCell: (props) => (
        <SelectCell
          row={props.row}
          rowIndex={props.rowIdx + 1}
          onClick={() => {
            if (props.row.locked && props.row.agentRunId) {
              setSelectedAgentRunId(props.row.agentRunId);
            }
          }}
        />
      ),
      renderSummaryCell: () => (
        <AddRecordButton
          handleClick={createEmptyRecord}
          icon={<Plus className="size-4" />}
        />
      ),
    },
    ...(fields.map((field, index) => ({
      key: field.uuid,
      minWidth: 207,
      width: 207,
      minHeight: 37,
      resizable: true,
      name: '',
      renderHeaderCell: () => <ApFieldHeader field={{ ...field, index }} />,
      renderCell: ({
        row,
        column,
        rowIdx,
      }: RenderCellProps<Row, { id: string }>) => (
        <EditableCell
          key={row.id + '_' + field.uuid}
          field={field}
          value={row[field.uuid]}
          row={row}
          column={column}
          rowIdx={rowIdx}
          disabled={!userHasTableWritePermission}
          locked={row.locked}
          onClick={() => {
            if (row.locked && row.agentRunId) {
              setSelectedAgentRunId(row.agentRunId);
            }
          }}
        />
      ),
      renderSummaryCell: () => (
        <AddRecordButton handleClick={createEmptyRecord} />
      ),
    })) ?? []),
  ];

  if (isAllowedToCreateField) {
    columns.push(newFieldColumn);
  }
  return columns;
}

export function mapRecordsToRows(
  records: ClientRecordData[],
  fields: any[],
): Row[] {
  if (!records || records.length === 0) return [];
  return records.map((record: ClientRecordData) => {
    const row: Row = {
      id: record.uuid,
      agentRunId: record.agentRunId ?? null,
      locked: !isNil(record.agentRunId),
    };
    record.values.forEach((cell) => {
      const field = fields[cell.fieldIndex];
      if (field) {
        row[field.uuid] = cell.value;
      }
    });
    return row;
  });
}

type AddRecordButtonProps = {
  handleClick: () => void;
  icon?: ReactNode;
};

function AddRecordButton({ handleClick, icon }: AddRecordButtonProps) {
  const exccedTableLimit = platformHooks.useCheckResourceIsLocked(
    PlatformUsageMetric.TABLES,
  );

  return exccedTableLimit ? (
    <Tooltip>
      <TooltipTrigger className="w-full h-full border-t border-border bg-muted text-muted-foreground flex items-center justify-start pl-4">
        {icon}
      </TooltipTrigger>
      <TooltipContent>
        {t(
          'Table limit exceeded. Delete unnecessary tables or upgrade to unlock access.',
        )}
      </TooltipContent>
    </Tooltip>
  ) : (
    <div
      className="w-full h-full border-t border-border  flex items-center justify-start cursor-pointer pl-4"
      onClick={handleClick}
    >
      {icon}
    </div>
  );
}

function AddFieldButton() {
  const exccedTableLimit = platformHooks.useCheckResourceIsLocked(
    PlatformUsageMetric.TABLES,
  );

  return exccedTableLimit ? (
    <Tooltip>
      <TooltipTrigger className="w-full h-full bg-muted text-muted-foreground flex items-center justify-center new-field">
        <Plus className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent>
        {t(
          'You have exceeded tables limit please delete extra tables or upgrade to retain access',
        )}
      </TooltipContent>
    </Tooltip>
  ) : (
    <NewFieldPopup>
      <div className="w-full h-full flex items-center justify-center cursor-pointer new-field">
        <Plus className="h-4 w-4" />
      </div>
    </NewFieldPopup>
  );
}
