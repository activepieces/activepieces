import { nanoid } from 'nanoid';
import { useRef, useEffect } from 'react';
import DataGrid, { DataGridHandle } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@/components/theme-provider';
import { Drawer, DrawerContent, DrawerHeader } from '@/components/ui/drawer';
import { ApTableFooter } from '@/features/tables/components/ap-table-footer';
import { ApTableHeader } from '@/features/tables/components/ap-table-header';
import {
  useTableColumns,
  mapRecordsToRows,
} from '@/features/tables/components/table-columns';
import { Row, ROW_HEIGHT_MAP, RowHeight } from '@/features/tables/lib/types';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { ApFlagId, Permission } from '@activepieces/shared';

import './react-data-grid.css';
import { useTableState } from '../../../../features/tables/components/ap-table-state-provider';

const ApTableEditorPage = () => {
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId();
  const [
    selectedRecords,
    setSelectedRecords,
    selectedCell,
    setSelectedCell,
    createRecord,
    fields,
    records,
  ] = useTableState((state) => [
    state.selectedRecords,
    state.setSelectedRecords,
    state.selectedCell,
    state.setSelectedCell,
    state.createRecord,
    state.fields,
    state.records,
  ]);

  const gridRef = useRef<DataGridHandle>(null);
  const { theme } = useTheme();
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );

  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const isAllowedToCreateRecord =
    userHasTableWritePermission && maxRecords && records.length < maxRecords;

  const createEmptyRecord = () => {
    createRecord({
      uuid: nanoid(),
      values: [],
    });
    requestAnimationFrame(() => {
      gridRef.current?.scrollToCell({
        rowIdx: records.length,
        idx: 0,
      });
    });
  };

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

  const columns = useTableColumns(createEmptyRecord);
  const rows = mapRecordsToRows(records, fields);

  const handleBack = () => {
    navigate(`/projects/${projectId}/tables`);
  };

  return (
    <Drawer
      open={true}
      onOpenChange={handleBack}
      dismissible={false}
      direction="right"
    >
      <DrawerContent fullscreen className="w-full overflow-auto">
        <DrawerHeader>
          <ApTableHeader onBack={handleBack} />
        </DrawerHeader>

        <div className="flex flex-col flex-1 h-full">
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <DataGrid
                ref={gridRef}
                columns={columns}
                rows={rows}
                rowKeyGetter={(row: Row) => row.id}
                selectedRows={selectedRecords}
                onSelectedRowsChange={setSelectedRecords}
                className={cn(
                  'scroll-smooth w-full h-full bg-muted/30',
                  theme === 'dark' ? 'rdg-dark' : 'rdg-light',
                )}
                bottomSummaryRows={
                  userHasTableWritePermission ? [{ id: 'new-record' }] : []
                }
                rowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
                headerRowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
                summaryRowHeight={
                  isAllowedToCreateRecord
                    ? ROW_HEIGHT_MAP[RowHeight.DEFAULT]
                    : 0
                }
              />
            </div>
            <ApTableFooter
              fieldsCount={fields.length}
              recordsCount={records.length}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
