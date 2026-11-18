import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioExportItemsOutputSchema } from '../../../output-schemas';

const EXPORTERS = ['xlsx', 'xls'];

export const exportItemsAction = createAction({
  auth: podioAuth,
  name: 'podio_export_items',
  outputSchema: podioExportItemsOutputSchema,
  displayName: 'Export Items',
  description: 'Starts an export of an app\'s items to an Excel file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a background export of an app\'s items, optionally narrowed by a saved view or filters, to an xlsx or xls file and returns a batch id; poll it with Get Batch until the file is ready. Use Get Items as Xlsx for up to 1000 items at once. The app id comes from List Apps in Space, view ids from List Views.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps in Space or Get App.' }),
    exporter: podioAiProps.choice({ required: true, displayName: 'Format', description: 'The file format.', values: EXPORTERS }),
    viewId: podioAiProps.id({ required: false, displayName: 'View ID', description: 'The id of a saved view to apply, from List Views; "0" applies the last used view.' }),
    filters: podioAiProps.json({ required: false, displayName: 'Filters', description: 'Filters in the Filter Items format, e.g. {"status": [1, 2]}.' }),
    sortBy: podioAiProps.text({ required: false, displayName: 'Sort By', description: 'What to sort by when no view is given: a field id, or created_on, last_edit_on, title and the other Podio sort keys.' }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending, "false" ascending.' }),
    splitEmailByType: podioAiProps.bool({ required: false, displayName: 'Split Emails by Type', description: '"false" puts all email addresses of a field in one column. Defaults to "true".' }),
    splitPhoneByType: podioAiProps.bool({ required: false, displayName: 'Split Phones by Type', description: '"false" puts all phone numbers of a field in one column. Defaults to "true".' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of items to export. Exports all matching items when unset.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (!EXPORTERS.includes(propsValue.exporter)) {
      throw new Error(`Format must be one of: ${EXPORTERS.join(', ')}.`);
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/item/app/${propsValue.appId}/export/${propsValue.exporter}`,
      body: podioUtils.body({
        values: {
          view_id: propsValue.viewId ? Number(propsValue.viewId) : undefined,
          filters: propsValue.filters,
          sort_by: propsValue.sortBy,
          sort_desc: podioUtils.toBool({ value: propsValue.sortDesc }),
          split_email_by_type: podioUtils.toBool({ value: propsValue.splitEmailByType }),
          split_phone_by_type: podioUtils.toBool({ value: propsValue.splitPhoneByType }),
          limit: propsValue.limit ?? undefined,
          offset: propsValue.offset ?? undefined,
        },
      }),
    });
  },
});
