import {
  ExportTableResponse,
  FieldType,
  isNil,
  SharedTemplate,
  TableTemplate,
} from '@activepieces/shared';
import { t } from 'i18next';
import JSZip from 'jszip';
import {
  Type,
  Calendar,
  CalendarClock,
  Hash,
  ChevronDownCircle,
} from 'lucide-react';
import { parse } from 'papaparse';
import { createContext, ReactNode } from 'react';
import { z } from 'zod';

import { downloadFile } from '@/lib/dom-utils';

import {
  ClientField,
  ClientRecordData,
} from '../stores/store/ap-tables-client-state';

function getColumnIcon(type: FieldType): ReactNode {
  switch (type) {
    case FieldType.TEXT:
      return <Type className="h-4 w-4" />;
    case FieldType.DATE:
      return <Calendar className="h-4 w-4" />;
    case FieldType.DATETIME:
      return <CalendarClock className="h-4 w-4" />;
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
function getTemplateError({
  template,
  existingTableId,
}: {
  template: SharedTemplate;
  existingTableId?: string;
}): string | null {
  const reason = findTemplateIssue({ template, existingTableId });
  return isNil(reason)
    ? null
    : t('This file is not a valid table template: {reason}', { reason });
}

function findTemplateIssue({
  template,
  existingTableId,
}: {
  template: SharedTemplate;
  existingTableId?: string;
}): string | null {
  const tables = template.tables ?? [];
  if (tables.length === 0) {
    return t('it has no tables');
  }
  if (!isNil(existingTableId) && tables.length > 1) {
    return t(
      'it has more than one table, but you can only import one into an existing table',
    );
  }
  const parsed = TableTemplate.array().safeParse(tables);
  if (!parsed.success) {
    const { issues } = parsed.error;
    const tableNameOrFieldsIssue = issues.find(
      ({ path }) =>
        path.length === 2 && (path[1] === 'name' || path[1] === 'fields'),
    );
    return describeTemplateIssue({
      path: (tableNameOrFieldsIssue ?? issues[0]).path,
      tables,
    });
  }
  return (
    tables
      .flatMap((table) => table.fields)
      .map(findFieldIssue)
      .find((issue) => !isNil(issue)) ?? null
  );
}

function describeTemplateIssue({
  path,
  tables,
}: {
  path: PropertyKey[];
  tables: TableTemplate[];
}): string {
  const [tableIndex, section, fieldIndex, key] = path;
  const tableKey = TableTemplate.keyof().safeParse(section);
  if (!tableKey.success || typeof tableIndex !== 'number') {
    return t('one of its tables is not in the expected format');
  }
  switch (tableKey.data) {
    case 'externalId':
      return t('the table has no externalId');
    case 'data':
      return t('its rows are not in the expected format');
    case 'fields':
      return describeFieldIssue({
        fields: tables[tableIndex].fields,
        fieldIndex,
        key,
      });
    case 'name':
      return t('the table has no name');
    case 'status':
      return t('the table status is not in the expected format');
    case 'trigger':
      return t('the table trigger is not in the expected format');
  }
}

function describeFieldIssue({
  fields,
  fieldIndex,
  key,
}: {
  fields: TableTemplate['fields'];
  fieldIndex: PropertyKey | undefined;
  key: PropertyKey | undefined;
}): string {
  if (typeof fieldIndex !== 'number') {
    return t('it has no list of columns');
  }
  const name = fields[fieldIndex]?.name;
  const fieldKey = TableTemplate.shape.fields.element.keyof().safeParse(key);
  if (!fieldKey.success) {
    return t('column "{name}" is not in the expected format', { name });
  }
  switch (fieldKey.data) {
    case 'name':
      return t('column {position} has no name', { position: fieldIndex + 1 });
    case 'type':
      return t('column "{name}" has no type', { name });
    case 'externalId':
      return t('column "{name}" has no externalId', { name });
    case 'data':
      return t('column "{name}" is not in the expected format', { name });
  }
}

function findFieldIssue(field: TableTemplate['fields'][number]): string | null {
  if (!z.enum(FieldType).safeParse(field.type).success) {
    return t('column "{name}" has an unsupported type "{type}"', {
      name: field.name,
      type: field.type,
    });
  }
  if (field.type === FieldType.STATIC_DROPDOWN && isNil(field.data)) {
    return t('column "{name}" is a dropdown with no options', {
      name: field.name,
    });
  }
  return null;
}

export const tablesUtils = {
  getTemplateError,
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

  parseCsv: (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      parse<string[]>(file, {
        header: false,
        skipEmptyLines: 'greedy',
        worker: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    });
  },
};
