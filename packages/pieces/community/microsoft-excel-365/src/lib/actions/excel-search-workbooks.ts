import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { collectWorkbooks, createMSGraphClientFromAuth, getLocationDrivePath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelSearchWorkbooks = createAction({
  auth: excelAuth,
  name: 'excel_search_workbooks',
  classification: 'SEARCH',
  displayName: 'Search Workbooks',
  description: 'Search the drive for .xlsx workbooks matching a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Search the whole drive for .xlsx workbooks whose name or content matches a keyword, to resolve a Workbook ID from a known name. Use excel_list_workbooks to browse without a query or to list one folder. Matching is fuzzy full-text, so check the returned names; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Text to search for, e.g. part of the workbook file name.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of workbooks to return. Returns all when empty.',
      required: false,
    }),
  },
  async run(context) {
    const { query, limit } = context.propsValue;
    const text = requireValue({ value: query, name: 'Query' }).replace(/'/g, "''");
    const drive = getLocationDrivePath(context.propsValue);
    const max = typeof limit === 'number' && limit > 0 ? Math.floor(limit) : undefined;
    const workbooks = await collectWorkbooks({
      client: createMSGraphClientFromAuth({ auth: context.auth }),
      path: `${drive}/root/search(q='${encodeURIComponent(text)}')`,
      max,
    });
    return { workbooks, count: workbooks.length };
  },
});
