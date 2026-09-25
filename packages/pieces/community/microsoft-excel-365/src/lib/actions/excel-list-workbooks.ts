import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { collectWorkbooks, createMSGraphClientFromAuth, getLocationDrivePath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelListWorkbooks = createAction({
  auth: excelAuth,
  name: 'excel_list_workbooks',
  classification: 'SEARCH',
  displayName: 'List Workbooks',
  description: 'List .xlsx workbooks in a drive or in one folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Enumerate .xlsx workbooks across the whole drive, or only the direct children of one folder when Folder ID is given. Use to browse available spreadsheets; use excel_search_workbooks to find a workbook by name or keyword. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Drive item ID of a folder to list. Leave empty to list workbooks across the whole drive.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of workbooks to return. Returns all when empty.',
      required: false,
    }),
  },
  async run(context) {
    const { folderId, limit } = context.propsValue;
    const drive = getLocationDrivePath(context.propsValue);
    const folder = folderId?.trim();
    const path = folder
      ? `${drive}/items/${encodeURIComponent(folder)}/children`
      : `${drive}/root/search(q='.xlsx')`;
    const max = typeof limit === 'number' && limit > 0 ? Math.floor(limit) : undefined;
    const workbooks = await collectWorkbooks({
      client: createMSGraphClientFromAuth({ auth: context.auth }),
      path,
      max,
    });
    return { workbooks, count: workbooks.length };
  },
});
