import { useState } from "react";
import { DatePickerWithRange } from "../../../../components/ui/date-picker-range"
import { DateRange } from "react-day-picker";
import dayjs from "dayjs";
import { t } from "i18next";
import { DataTable, RowDataWithActions } from "../../../../components/ui/data-table";
import { analyticsApi } from "../../../../features/platform-admin-panel/lib/analytics-api";
import { ColumnDef } from "@tanstack/react-table";
import { PlatfromProjectLeaderBoardRow } from "../../../../../../shared/src";
import { DataTableColumnHeader } from "../../../../components/ui/data-table-column-header";


const columns: ColumnDef<RowDataWithActions<PlatfromProjectLeaderBoardRow>>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{(row.original as any).project_displayName}</div>;
      },
    },
    {
        accessorKey: 'users',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Users')} />
        ),
        cell: ({ row }) => {
          return <div className="text-left">{row.original.users}</div>;
        },
      },
      {
        accessorKey: 'flowsCreated',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Flows Created')} />
        ),
        cell: ({ row }) => {
          return <div className="text-left">{row.original.flowsCreated}</div>;
        },
      },
      {
        accessorKey: 'flowsPublished',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Flow Publishes')} />
        ),
        cell: ({ row }) => {
          return <div className="text-left">{row.original.flowsPublished}</div>;
        },
      },
      {
        accessorKey: 'flowEdits',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Flow Edits')} />
        ),
        cell: ({ row }) => {
          return <div className="text-left">{row.original.flowEdits}</div>;
        },
      },
      {
        accessorKey: 'tasks',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Tasks')} />
        ),
        cell: ({ row }) => {
          return <div className="text-left">{row.original.tasks}</div>;
        },
      },
      {
        accessorKey: 'pieces',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Pieces')} />
        ),
        cell: ({ row }) => {
          return <div className="text-left">{row.original.piecesUsed}</div>;
        },
      },
      {
        accessorKey: 'connections',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Connections')} />
        ),
        cell: ({ row }) => {
          return <div className="text-left">{row.original.connectionCreated}</div>;
        },
      },
]
export const  ProjectsLeaderBoard = () =>{
    const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >({
    from: dayjs().subtract(3, 'months').toDate(),
    to: dayjs().toDate(),
  });


    return (
        <>  <div className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row mb-4">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <div className="text-xl font-semibold ">{t('Projects Leaderboard')}</div>
        </div>
        <DatePickerWithRange
          onChange={setSelectedDateRange}
          from={selectedDateRange?.from?.toISOString()}
          to={selectedDateRange?.to?.toISOString()}
          maxDate={new Date()}
          presetType="past"
        />
        </div>

        <DataTable 
        
        columns={columns}
          fetchData={(_, pagination) => {
            console.log(pagination);
            return analyticsApi.listProjectsLeaderBoard({
              cursor: pagination.cursor,
              limit: pagination.limit ?? 10,
            });
          }}>

        </DataTable>
        </>
      
        
    )

}