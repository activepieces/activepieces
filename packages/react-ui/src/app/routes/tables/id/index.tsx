import { nanoid } from 'nanoid';
import { useRef, useEffect } from 'react';
import DataGrid, { DataGridHandle } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate } from 'react-router-dom';
import {
  useSensor,
  DndContext,
  useSensors,
  PointerSensor,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy
} from "@dnd-kit/sortable";

import { useSocket } from '@/components/socket-provider';
import { useTheme } from '@/components/theme-provider';
import { Drawer, DrawerContent, DrawerHeader } from '@/components/ui/drawer';
import { AgentRunDialog } from '@/features/agents/agent-run-dialog';
import { ApTableFooter } from '@/features/tables/components/ap-table-footer';
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
    createRecord,
    fields,
    records,
    selectedAgentRunId,
    setSelectedAgentRunId,
    setRecords,
    swapIndexes
  ] = useTableState((state) => [
    state.table,
    state.setAgentRunId,
    state.selectedRecords,
    state.setSelectedRecords,
    state.selectedCell,
    state.setSelectedCell,
    state.createRecord,
    state.fields,
    state.records,
    state.selectedAgentRunId,
    state.setSelectedAgentRunId,
    state.setRecords,
    state.swapIndexes
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
    createRecord({
      uuid: nanoid(),
      agentRunId: null,
      values: [],
    });
    requestAnimationFrame(() => {
      gridRef.current?.scrollToCell({
        rowIdx: records.length,
        idx: 0,
      });
      setSelectedCell({
        rowIdx: records.length,
        columnIdx: 1,
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

  useEffect(() => {
    socket.on(
      WebsocketClientEvent.AGENT_RUN_PROGRESS,
      async (agentRun: AgentRun) => {
        if (agentRun.metadata?.tableId === table.id) {
          setAgentRunId(
            agentRun.metadata.recordId!,
            agentRun.status === AgentTaskStatus.IN_PROGRESS
              ? agentRun.id
              : null,
          );
          if (
            agentRun.status === AgentTaskStatus.COMPLETED ||
            agentRun.status === AgentTaskStatus.FAILED
          ) {
            const records = await recordsApi.list({
              tableId: table.id,
              limit: 999999,
              cursor: undefined,
            });
            setRecords(records.data);
          }
        }
      },
    );
    return () => {
      socket.off(WebsocketClientEvent.AGENT_RUN_PROGRESS);
    };
  }, [table.id, setAgentRunId, socket]);

  const columns = useTableColumns(createEmptyRecord);
  const rows = mapRecordsToRows(records, fields);

  const handleBack = () => {
    navigate(`/projects/${projectId}/tables`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {

      const activeIndex = columns.findIndex(c => c.key === active.id) - 1;
      const overIndex = columns.findIndex(c => c.key === over.id) - 1;

      swapIndexes(activeIndex, overIndex)
    }
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
            <ApTableHeader onBack={handleBack} />
          </div>
        </DrawerHeader>

        <div className="flex flex-col flex-1 h-full">
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={columns.map(c => c.key)} strategy={horizontalListSortingStrategy}>
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
                </SortableContext>
              </DndContext>
            </div>
            <ApTableFooter
              fieldsCount={fields.length}
              recordsCount={records.length}
            />
          </div>
        </div>
      </DrawerContent>

      <AgentRunDialog
        agentRunId={selectedAgentRunId}
        open={!!selectedAgentRunId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAgentRunId(null);
          }
        }}
      />
    </Drawer>
  );
};

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
