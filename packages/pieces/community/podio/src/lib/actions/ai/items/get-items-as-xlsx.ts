import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetItemsAsXlsxOutputSchema } from '../../../output-schemas';

export const getItemsAsXlsxAction = createAction({
  auth: podioAuth,
  name: 'podio_get_items_as_xlsx',
  outputSchema: podioGetItemsAsXlsxOutputSchema,
  displayName: 'Get Items as Xlsx',
  description: 'Downloads the items of an app as an Excel (xlsx) file.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns up to 1000 of an app\'s items, matching a saved view and/or filters, as an Excel xlsx file. Filter values are strings: "1;2" for lists, "20-100" for ranges, "user:1" for created_by. Use Export Items for larger exports. The app id comes from List Apps in Space, view ids from List Views and field ids from Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps in Space or Get App.' }),
    viewId: podioAiProps.id({ required: false, displayName: 'View ID', description: 'The id of a saved view to apply, from List Views; "0" applies the last used view.' }),
    filters: podioAiProps.json({
      required: false,
      displayName: 'Filters',
      description: 'Filters keyed by field id or a built-in key, as strings, e.g. {"876": "null;active", "created_on": "2026-01-01-2026-06-30"}.',
    }),
    sortBy: podioAiProps.text({ required: false, displayName: 'Sort By', description: 'What to sort by: a field id, or created_on, last_edit_on, title and the other Podio sort keys.' }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending, "false" ascending. Defaults to "true".' }),
    deletedColumns: podioAiProps.bool({ required: false, displayName: 'Include Deleted Columns', description: '"true" includes columns of deleted fields. Defaults to "false".' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of items to include. Defaults to 20, at most 1000.' }),
    offset: podioAiProps.offset({ required: false }),
    remember: podioAiProps.bool({ required: false, displayName: 'Remember', description: '"true" saves the view as the connected user\'s last used view. Defaults to "true".' }),
  },
  async run({ auth, propsValue, files }) {
    const data = await podioClient.download({
      auth,
      path: `/item/app/${propsValue.appId}/xlsx/`,
      query: podioUtils.query({
        values: {
          ...filtersToQuery({ filters: propsValue.filters }),
          view_id: propsValue.viewId,
          sort_by: propsValue.sortBy,
          sort_desc: propsValue.sortDesc,
          deleted_columns: propsValue.deletedColumns,
          limit: Math.min(propsValue.limit ?? 20, 1000),
          offset: propsValue.offset,
          remember: propsValue.remember,
        },
      }),
    });
    const fileName = `podio-app-${propsValue.appId}-items.xlsx`;
    const file = await files.write({ fileName, data });
    return { file, file_name: fileName, size_bytes: data.length };
  },
});

function filtersToQuery({ filters }: { filters: Record<string, unknown> | undefined }): Record<string, string> {
  return Object.fromEntries(Object.entries(filters ?? {}).map(([key, value]) => [key, String(value)]));
}
