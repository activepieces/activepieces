import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import DataGrid, {
  Column,
  RenderCellProps,
  DataGridHandle,
} from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useParams, useLocation } from 'react-router-dom';

import { useTheme } from '@/components/theme-provider';
import { LoadingSpinner } from '@/components/ui/spinner';
import ApTableHeader from '@/features/tables/components/ap-table-header';
import {
  ColumnHeader,
  ColumnActionType,
} from '@/features/tables/components/column-header';
import { EditableCell } from '@/features/tables/components/editable-cell';
import { NewFieldPopup } from '@/features/tables/components/new-field-popup';
import { SelectColumn } from '@/features/tables/components/select-column';
import { tableHooks } from '@/features/tables/lib/ap-tables-hooks';
import { Row, ROW_HEIGHT_MAP, RowHeight } from '@/features/tables/lib/types';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { Field, Permission, PopulatedRecord } from '@activepieces/shared';
import './react-data-grid.css';

import { useTableState } from '../../../../features/tables/components/ap-table-state-provider';

const ApTableEditorPage = () => {
  const { tableId } = useParams();
  if (!tableId) {
    console.error('Table ID is required');
    return null;
  }
  return <ApTableEditorPageImplementation tableId={tableId} />;
};
const ApTableEditorPageImplementation = ({ tableId }: { tableId: string }) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [
    enqueueMutation,
    rowHeight,
    selectedRows,
    setSelectedRows,
    selectedCell,
    setSelectedCell,
  ] = useTableState((state) => [
    state.enqueueMutation,
    state.rowHeight,
    state.selectedRows,
    state.setSelectedRows,
    state.selectedCell,
    state.setSelectedCell,
  ]);
  const [lastRowIdx, setLastRowIdx] = useState<number>(0);
  const gridRef = useRef<DataGridHandle>(null);
  const { theme } = useTheme();
  const currentProjectId = authenticationSession.getProjectId();
  const { data: fieldsData, isLoading: isFieldsLoading } =
    tableHooks.useFetchFields(tableId);
  const createEmptyRecord = () => {
    const tempId = 'temp-' + Date.now();
    // Create an empty record in the grid
    const emptyRecord: PopulatedRecord = {
      id: tempId,
      cells: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      projectId: currentProjectId!,
      tableId: tableId!,
      order:0
    };

    queryClient.setQueryData(
      ['records', tableId, location.search],
      (old: { pages: { data: PopulatedRecord[] }[] }) => {
        if (!old) {
          return { pages: [{ data: [emptyRecord] }] };
        }

        const updatedData = {
          ...old,
          pages: old.pages.map((page, index) =>
            index === old.pages.length - 1
              ? {
                  ...page,
                  data: [...page.data, emptyRecord],
                }
              : page,
          ),
        };

        return updatedData;
      },
    );

    setTimeout(() => {
      gridRef.current?.scrollToCell({
        rowIdx: lastRowIdx,
        idx: 0,
      });
    }, 0);
  };
  const {
    data: recordsPages,
    isLoading: isRecordsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = tableHooks.useFetchRecords({ tableId, location });

  useEffect(() => {
    if (recordsPages) {
      const totalRows = recordsPages.pages.reduce(
        (sum, page) => sum + page.data.length,
        0,
      );
      setLastRowIdx(totalRows);
    }
  }, [recordsPages]);

  const { isLoading: isTableLoading } = tableHooks.useFetchTable(tableId);

  const updateRecordMutation = tableHooks.useUpdateRecord({
    queryClient,
    tableId,
    location,
  });

  const deleteFieldMutation = tableHooks.useDeleteField({
    queryClient,
    tableId,
  });

  const createRecordMutation = tableHooks.useCreateRecord({
    queryClient,
    tableId,
    location,
  });
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectedCell &&
        !(event.target as HTMLElement).closest(
          `#editable-cell-${selectedCell.rowIdx}-${selectedCell.columnIdx}`,
        )
      ) {
        setSelectedCell(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedCell]);
  const newFieldColumn = {
    key: 'new-field',
    minWidth: 67,
    maxWidth: 67,
    width: 67,
    name: '',
    renderHeaderCell: () => (
      <NewFieldPopup tableId={tableId!}>
        <div className="w-full h-full flex items-center justify-center cursor-pointer new-field">
          <Plus className="h-4 w-4" />
        </div>
      </NewFieldPopup>
    ),
    renderCell: () => <div className="empty-cell"></div>,
  };
  const columns: Column<Row, { id: string }>[] = [
    {
      ...SelectColumn,
      renderSummaryCell: userHasTableWritePermission
        ? () => (
            <div
              className="w-full h-full flex items-center justify-start cursor-pointer pl-4"
              onClick={createEmptyRecord}
            >
              <Plus className="h-4 w-4" />
            </div>
          )
        : undefined,
    },
    ...(fieldsData?.map((field) => ({
      key: field.name,
      minWidth: 207,
      width: 207,
      minHeight: 37,
      resizable: true,
      name: '',
      renderHeaderCell: () => (
        <ColumnHeader
          label={field.name}
          type={field.type}
          actions={
            userHasTableWritePermission
              ? [
                  {
                    type: ColumnActionType.DELETE,
                    onClick: async () => {
                      await enqueueMutation(deleteFieldMutation, field.id);
                    },
                  },
                ]
              : []
          }
        />
      ),
      renderCell: ({
        row,
        column,
        rowIdx,
      }: RenderCellProps<Row, { id: string }>) => (
        <EditableCell
          key={row[field.name]}
          type={field.type}
          value={row[field.name]?? ''}
          row={row}
          column={column}
          rowIdx={rowIdx}
          disabled={!userHasTableWritePermission}
          onRowChange={(newRow, commitChanges) => {
            if (commitChanges) {
              if (row.id.startsWith('temp-')) {
                handleCellEdit(row, field, String(newRow[field.name]), row.id);
              } else {
                handleCellEdit(row, field, String(newRow[field.name]));
              }
            }
          }}
        />
      ),
      renderSummaryCell: userHasTableWritePermission
        ? () => (
            <div
              className="w-full h-full flex items-center justify-start cursor-pointer pl-4"
              onClick={createEmptyRecord}
            ></div>
          )
        : undefined,
    })) ?? []),
  ];
  if (userHasTableWritePermission) {
    columns.push(newFieldColumn);
  }
  function onSelectedRowsChange(newSelectedRows: ReadonlySet<string>) {
    setSelectedRows(newSelectedRows);
  }

  const handleScroll = ({ currentTarget }: React.UIEvent<HTMLDivElement>) => {
    const target = currentTarget;
    const scrollPosition = target.scrollTop + target.clientHeight;
    const scrollThreshold = target.scrollHeight - 500; // Load more when 500px from bottom

    if (
      scrollPosition > scrollThreshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage( );
    }
  };

  function mapRecordsToRows(
    pages: typeof recordsPages,
    fields: Field[],
  ): Row[] {
    if (!pages) return [];
    return pages.pages.flatMap((page) =>
      page.data.map((record: PopulatedRecord) => {
        const row: Row = { id: record.id };
        record.cells.forEach((cell) => {
          const field = fields.find((f) => f.id === cell.fieldId);
          if (field) {
            row[field.name] = cell.value;
          }
        });
        return row;
      }),
    );
  }

  const isLoading = isFieldsLoading || isRecordsLoading || isTableLoading;

  const handleCellEdit = async (
    row: Row,
    field: Field,
    newValue: string,
    tempId?: string,
  ) => {
    if (tempId) {
      await enqueueMutation(createRecordMutation, {
        field,
        value: newValue,
        tempId,
      });
    } else {
      await enqueueMutation(updateRecordMutation, {
        recordId: row.id,
        request: {
          tableId: tableId!,
          cells: [
            {
              fieldId: field.id,
              value: newValue,
            },
          ],
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <LoadingSpinner size={50}></LoadingSpinner>
      </div>
    );
  }

  return (
    <div className="overflow-hidden flex flex-col">
      <ApTableHeader
        tableId={tableId}
        isFetchingNextPage={isFetchingNextPage}
      ></ApTableHeader>
      <div className="flex-1 min-h-0 mt-4 grid-wrapper   overflow-hidden">
        <DataGrid
          ref={gridRef}
          columns={columns}
          rows={mapRecordsToRows(recordsPages, fieldsData ?? [])}
          rowKeyGetter={(row: Row) => row.id}
          selectedRows={selectedRows}
          onSelectedRowsChange={onSelectedRowsChange}
          className={cn(
            'h-[calc(100vh-8rem)] bg-muted/30 scroll-smooth',
            theme === 'dark' ? 'rdg-dark' : 'rdg-light',
          )}
          bottomSummaryRows={
            userHasTableWritePermission ? [{ id: 'new-record' }] : []
          }
          rowHeight={ROW_HEIGHT_MAP[rowHeight]}
          headerRowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
          summaryRowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
          onScroll={handleScroll}
        />
      </div>
    </div>
  );
};

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
