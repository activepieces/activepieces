import { nanoid } from 'nanoid';
import { useRef, useEffect } from 'react';
import DataGrid, { DataGridHandle } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate } from 'react-router-dom';

import { useSocket } from '@/components/socket-provider';
import { useTheme } from '@/components/theme-provider';
import { Drawer, DrawerContent, DrawerHeader } from '@/components/ui/drawer';
import { agentRunsApi } from '@/features/agents/lib/agents-api';
import { ApTableControl } from '@/features/tables/components/ap-table-control';
import { ApTableHeader } from '@/features/tables/components/ap-table-header';
import { useTableState } from '@/features/tables/components/ap-table-state-provider';
import {
  useTableColumns,
  mapRecordsToRows,
} from '@/features/tables/components/table-columns';
import { recordsApi } from '@/features/tables/lib/records-api';
import { Row, ROW_HEIGHT_MAP, RowHeight } from '@/features/tables/lib/types';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import {
  AgentRun,
  AgentTaskStatus,
  ApFlagId,
  Permission,
  WebsocketClientEvent,
} from '@activepieces/shared';

import './react-data-grid.css';

const ApTableEditorPage = () => {
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId();
  const [
    table,
    setAgentRunId,
    selectedRecords,
    setSelectedRecords,
    selectedCell,
    setSelectedCell,
    fields,
    records,
    setSelectedAgentRunId,
    setRecords,
    setRuns,
    createTemporaryRecord,
  ] = useTableState((state) => [
    state.table,
    state.setAgentRunId,
    state.selectedRecords,
    state.setSelectedRecords,
    state.selectedCell,
    state.setSelectedCell,
    state.fields,
    state.records,
    state.setSelectedAgentRunId,
    state.setRecords,
    state.setRuns,
    state.createTemporaryRecord,
  ]);

  const gridRef = useRef<DataGridHandle>(null);
  const { theme } = useTheme();
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );
  const socket = useSocket();
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const isAllowedToCreateRecord =
    userHasTableWritePermission && maxRecords && records.length < maxRecords;

  const createEmptyRecord = () => {
    const tempRecord = {
      uuid: nanoid(),
      agentRunId: null,
      values: [],
    };
    
    createTemporaryRecord(tempRecord);
    
    requestAnimationFrame(() => {
      gridRef.current?.scrollToCell({
        rowIdx: records.length,
        idx: 1,
      });
      setSelectedCell({
        recordId: tempRecord.uuid,
        rowIdx: records.length,
        columnIdx: 1,
      });
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!selectedCell) return;
      
      const target = event.target as HTMLElement;
      const addRecordButtonId = 'table-add-record-button';
      const isClickInsideAddRecordButton = target.closest(`#${addRecordButtonId}`);

      if (isClickInsideAddRecordButton) 
        return;
      
      const cellId = `editable-cell-${selectedCell.rowIdx}-${selectedCell.columnIdx}`;
      const isClickInside = target.closest(`#${cellId}`);
      
      if (!isClickInside) {
        setSelectedCell(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedCell]);

  useEffect(() => {
    socket.on(
      WebsocketClientEvent.AGENT_RUN_PROGRESS,
      async (agentRun: AgentRun) => {
        if (agentRun.metadata?.tableId === table.id) {
          if (agentRun.metadata?.recordId) {
            setAgentRunId(
              agentRun.metadata.recordId,
              agentRun.status === AgentTaskStatus.IN_PROGRESS
                ? agentRun.id
                : null,
            );
          }

          if (agentRun.status === AgentTaskStatus.IN_PROGRESS) {
            setSelectedAgentRunId(agentRun.id);
          } else if (
            agentRun.status === AgentTaskStatus.COMPLETED ||
            agentRun.status === AgentTaskStatus.FAILED
          ) {
            setSelectedAgentRunId(null);
            setSelectedRecords(new Set());
            setSelectedCell(null);
            const records = await recordsApi.list({
              tableId: table.id,
              limit: 999999,
              cursor: undefined,
            });
            setRecords(records.data);
            if (table.agent?.id) {
              const runs = await agentRunsApi.list({
                agentId: table.agent.id,
                limit: 999999,
                cursor: undefined,
              });
              setRuns(runs.data);
            }
          }
        }
      },
    );
    return () => {
      socket.off(WebsocketClientEvent.AGENT_RUN_PROGRESS);
    };
  }, [
    table.id,
    table.agent?.id,
    setAgentRunId,
    setSelectedAgentRunId,
    setRecords,
    setRuns,
    setSelectedRecords,
    setSelectedCell,
    socket,
  ]);

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
      closeOnEscape={false}
      direction="right"
    >
      <DrawerContent fullscreen className="w-full overflow-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between w-full pr-4">
            <ApTableHeader onBack={handleBack} agent={table.agent!} />
          </div>
        </DrawerHeader>

        <div className="flex flex-col flex-1 h-full bg-muted/50">
          <div className="flex-1 flex flex-col relative">
            <ApTableControl table={table} recordsCount={records.length} />
            <div className="flex-1 flex flex-row">
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
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
