import { ExportTableResponse, FieldType } from '@activepieces/shared';
import {
  Calendar03Icon,
  CalendarClockIcon,
  CircleArrowDown01Icon,
  HashIcon,
  TextIcon,
} from '@hugeicons/core-free-icons';
import JSZip from 'jszip';
import { createContext, ReactNode } from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { downloadFile } from '@/lib/dom-utils';

import {
  ClientField,
  ClientRecordData,
} from '../stores/store/ap-tables-client-state';

function getColumnIcon(type: FieldType): ReactNode {
  switch (type) {
    case FieldType.TEXT:
      return <HugeiconsIcon icon={TextIcon} className="h-4 w-4" />;
    case FieldType.DATE:
      return <HugeiconsIcon icon={Calendar03Icon} className="h-4 w-4" />;
    case FieldType.DATETIME:
      return <HugeiconsIcon icon={CalendarClockIcon} className="h-4 w-4" />;
    case FieldType.NUMBER:
      return <HugeiconsIcon icon={HashIcon} className="h-4 w-4" />;
    case FieldType.STATIC_DROPDOWN:
      return <HugeiconsIcon icon={CircleArrowDown01Icon} className="h-4 w-4" />;
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

function exportRecords({
  tableName,
  records,
  fields,
}: {
  tableName: string;
  records: ClientRecordData[];
  fields: ClientField[];
}) {
  const csvContent = getCsvContent({
    name: tableName,
    fields: fields.map((field) => ({
      id: field.uuid,
      name: field.name,
    })),
    rows: records.map((record) => {
      return record.values.reduce<Record<string, string>>((acc, cell) => {
        acc[fields[cell.fieldIndex].name] = cell.value as string;
        return acc;
      }, {});
    }),
  });
  downloadFile({
    obj: csvContent,
    fileName: `${tableName}`,
    extension: 'csv',
  });
}
export const tablesUtils = {
  exportTables,
  getColumnIcon,
  exportRecords,
};

export const FieldHeaderContext = createContext<{
  setIsPopoverOpen: (open: boolean) => void;
  setPopoverContent: (content: React.ReactNode) => void;
  field: ClientField & { index: number };
  userHasTableWritePermission: boolean;
} | null>(null);

// Map<CsvColumnIndex, FieldId>
export type FieldsMapping = (string | null)[];

export type SupportedFileType = 'csv' | 'json';

export const FILE_TYPES = {
  csv: { extension: '.csv', mimeType: 'text/csv' },
  json: { extension: '.json', mimeType: 'application/json' },
} as const;

export const fileUtils = {
  getExtension: (filename: string): string | null => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension || null;
  },

  isValidType: (extension: string | null): extension is SupportedFileType => {
    return extension === 'csv' || extension === 'json';
  },

  getAcceptedTypes: (): string => {
    return Object.values(FILE_TYPES)
      .map((type) => type.extension)
      .join(',');
  },

  validateFile: (
    file: File,
    maxSizeInMB?: number,
  ): { valid: boolean; error?: string } => {
    const extension = fileUtils.getExtension(file.name);

    if (!fileUtils.isValidType(extension)) {
      return {
        valid: false,
        error: 'Only CSV and JSON files are supported',
      };
    }

    if (maxSizeInMB && file.size > maxSizeInMB * 1024 * 1024) {
      return {
        valid: false,
        error: `Max file size is ${maxSizeInMB}MB`,
      };
    }

    return { valid: true };
  },
};
