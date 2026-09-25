import { createAction, Property } from '@activepieces/pieces-framework';
import {
  DriveItem,
  WorkbookNamedItem,
  WorkbookTable,
  WorkbookWorksheet,
} from '@microsoft/microsoft-graph-types';
import { Client } from '@microsoft/microsoft-graph-client';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getItemPath, getWorkbookPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelGetWorkbook = createAction({
  auth: excelAuth,
  name: 'excel_get_workbook',
  classification: 'READ',
  displayName: 'Get Workbook',
  description: 'Get a workbook file\'s details, optionally with its worksheets, tables and named items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read one workbook\'s file metadata (name, URL, size, dates, owner) by Workbook ID, and with Include Structure also its worksheet, table and named-item names in one call. Use it to orient in a workbook before editing; use excel_list_worksheets or excel_list_tables for full per-item details. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    includeStructure: Property.Checkbox({
      displayName: 'Include Structure',
      description: 'Also return the names and counts of worksheets, tables and named items.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const client = createMSGraphClientFromAuth({ auth: context.auth });
    const item: DriveItem = await client.api(getItemPath(context.propsValue)).get();
    const workbook = getWorkbookPath(context.propsValue);
    const structure = context.propsValue.includeStructure
      ? await Promise.all([
          fetchCollection<WorkbookWorksheet>({ client, path: `${workbook}/worksheets` }),
          fetchCollection<WorkbookTable>({ client, path: `${workbook}/tables` }),
          fetchCollection<WorkbookNamedItem>({ client, path: `${workbook}/names` }),
        ])
      : null;
    const [worksheets, tables, names] = structure ?? [[], [], []];
    return {
      id: item.id ?? null,
      name: item.name ?? null,
      webUrl: item.webUrl ?? null,
      size: item.size ?? null,
      createdDateTime: item.createdDateTime ?? null,
      lastModifiedDateTime: item.lastModifiedDateTime ?? null,
      lastModifiedBy: item.lastModifiedBy?.user?.displayName ?? null,
      createdBy: item.createdBy?.user?.displayName ?? null,
      parentId: item.parentReference?.id ?? null,
      driveId: item.parentReference?.driveId ?? null,
      worksheetNames: structure ? joinNames({ items: worksheets }) : null,
      worksheetCount: structure ? worksheets.length : null,
      tableNames: structure ? joinNames({ items: tables }) : null,
      tableCount: structure ? tables.length : null,
      namedItemNames: structure ? joinNames({ items: names }) : null,
      namedItemCount: structure ? names.length : null,
    };
  },
});

function joinNames({ items }: { items: { name?: string | null }[] }): string {
  return items.flatMap((entry) => (entry.name ? [entry.name] : [])).join(', ');
}

async function fetchCollection<T>({ client, path }: { client: Client; path: string }): Promise<T[]> {
  const page: { value?: T[] } = await client.api(path).get();
  return page.value ?? [];
}
