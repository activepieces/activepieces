import JSZip from 'jszip';
import { Type, Calendar, Hash, ChevronDownCircle } from 'lucide-react';
import { createContext, ReactNode } from 'react';

import { downloadFile } from '@/lib/utils';
import { ExportTableResponse, FieldType } from '@activepieces/shared';

import { ClientField } from './store/ap-tables-client-state';

function getColumnIcon(type: FieldType): ReactNode {
  switch (type) {
    case FieldType.TEXT:
      return <Type className="h-4 w-4" />;
    case FieldType.DATE:
      return <Calendar className="h-4 w-4" />;
    case FieldType.NUMBER:
      return <Hash className="h-4 w-4" />;
    case FieldType.STATIC_DROPDOWN:
      return <ChevronDownCircle className="h-4 w-4" />;
    default:
      return null;
  }
}
const getCsvContent = (table: ExportTableResponse) => {
  const csvRows: string[][] = [];
  csvRows.push(table.fields.map((f) => f.name));
  table.rows.forEach((row) => {
    csvRows.push(table.fields.map((field) => row[field.name] ?? ''));
  });
  return csvRows
    .map((row) =>
      row
        .map((cell) =>
          typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell,
        )
        .join(','),
    )
    .join('\n');
};
function exportTables(tables: ExportTableResponse[]) {
  if (tables.length === 1) {
    const csvContent = getCsvContent(tables[0]);
    downloadFile({
      obj: csvContent,
      fileName: `${tables[0].name}`,
      extension: 'csv',
    });
    return;
  }
  const zip = new JSZip();
  tables.forEach((table) => {
    const csvContent = getCsvContent(table);
    zip.file(`${table.name}.csv`, csvContent);
  });
  downloadFile({
    obj: zip,
    fileName: 'tables',
    extension: 'zip',
  });
}

export const tablesUtils = {
  exportTables,
  getColumnIcon,
};

export const FieldHeaderContext = createContext<{
  setIsPopoverOpen: (open: boolean) => void;
  setPopoverContent: (content: React.ReactNode) => void;
  field: ClientField & { index: number };
  userHasTableWritePermission: boolean;
} | null>(null);
