import React, { useState } from 'react';
import DataGrid, {
  SelectColumn,
  textEditor,
  Column,
  RowsChangeData,
} from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

import { TableTitle } from '@/components/ui/table-title';
import { formatUtils } from '@/lib/utils';
import { Field, FieldType, PopulatedRecord } from '@activepieces/shared';
import './react-data-grid.css';

const staticFields: Field[] = [
  {
    id: 'id-1',
    tableId: 'id-1',
    name: 'Name',
    type: FieldType.TEXT,
    created: formatUtils.formatDate(new Date()),
    updated: formatUtils.formatDate(new Date()),
  },
  {
    id: 'id-2',
    tableId: 'id-1',
    name: 'Age',
    type: FieldType.NUMBER,
    created: formatUtils.formatDate(new Date()),
    updated: formatUtils.formatDate(new Date()),
  },
  {
    id: 'id-3',
    tableId: 'id-1',
    name: 'Birthdate',
    type: FieldType.DATE,
    created: formatUtils.formatDate(new Date()),
    updated: formatUtils.formatDate(new Date()),
  },
];

const staticRecords: PopulatedRecord[] = [
  {
    id: 'rowid-1',
    tableId: 'id-1',
    created: formatUtils.formatDate(new Date()),
    updated: formatUtils.formatDate(new Date()),
    cells: [
      {
        id: 'id-1c',
        recordId: 'id-1',
        fieldId: 'id-1',
        value: 'John Doe',
        created: formatUtils.formatDate(new Date()),
        updated: formatUtils.formatDate(new Date()),
      },
      {
        id: 'id-2c',
        recordId: 'id-1',
        fieldId: 'id-2',
        value: 30,
        created: formatUtils.formatDate(new Date()),
        updated: formatUtils.formatDate(new Date()),
      },
      {
        id: 'id-3c',
        recordId: 'id-1',
        fieldId: 'id-3',
        value: formatUtils.formatDate(new Date('1990-01-01')),
        created: formatUtils.formatDate(new Date()),
        updated: formatUtils.formatDate(new Date()),
      },
    ],
  },
  {
    id: 'id-2',
    tableId: 'id-1',
    created: formatUtils.formatDate(new Date()),
    updated: formatUtils.formatDate(new Date()),
    cells: [
      {
        id: 'id-4c',
        recordId: 'id-2',
        fieldId: 'id-1',
        value: 'Jane Smith',
        created: formatUtils.formatDate(new Date()),
        updated: formatUtils.formatDate(new Date()),
      },
      {
        id: 'id-5c',
        recordId: 'id-2',
        fieldId: 'id-2',
        value: 25,
        created: formatUtils.formatDate(new Date()),
        updated: formatUtils.formatDate(new Date()),
      },
      {
        id: 'id-6c',
        recordId: 'id-2',
        fieldId: 'id-3',
        value: formatUtils.formatDate(new Date('1995-01-01')),
        created: formatUtils.formatDate(new Date()),
        updated: formatUtils.formatDate(new Date()),
      },
    ],
  },
];

type Row = {
  id: string;
  [key: string]: any;
};

function rowKeyGetter(record: Row) {
  return record.id;
}

const columns: Column<Row>[] = [
  SelectColumn,
  ...staticFields.map((field) => ({
    key: field.id,
    name: field.name,
    resizable: true,
    renderEditCell: textEditor,
  })),
];

function TablePage() {
  const [rows, setRows] = useState<Row[]>(() =>
    mapRecordsToRows(staticRecords, staticFields),
  );
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  function onRowsChange(rows: Row[], changeData: RowsChangeData<Row, unknown>) {
    const updatedRow = rows[changeData.indexes[0]];
    const cellName = changeData.column.name;
    const cellValue = updatedRow[changeData.column.key];
    console.log('updated row id', updatedRow.id);
    console.log(cellName, cellValue);
    setRows(rows);
  }

  function onSelectedRowsChange(newSelectedRows: ReadonlySet<string>) {
    console.log('selected rows', newSelectedRows);
    setSelectedRows(newSelectedRows);
  }

  function mapRecordsToRows(
    records: PopulatedRecord[],
    fields: Field[],
  ): Row[] {
    return records.map((record) => {
      const row: Row = { id: record.id };
      record.cells.forEach((cell) => {
        const field = fields.find((f) => f.id === cell.fieldId);
        if (field) {
          row[field.id] = cell.value;
        }
      });
      return row;
    });
  }

  return (
    <div className="flex-col w-full">
      <TableTitle>Table</TableTitle>
      <DataGrid
        columns={columns}
        rows={rows}
        rowKeyGetter={rowKeyGetter}
        onRowsChange={onRowsChange}
        selectedRows={selectedRows}
        onSelectedRowsChange={onSelectedRowsChange}
        className="rdg-light"
      />
    </div>
  );
}

export { TablePage };
