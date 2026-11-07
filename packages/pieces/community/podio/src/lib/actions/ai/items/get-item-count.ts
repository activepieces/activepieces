import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCountObjectTasksOutputSchema } from '../../../output-schemas';

export const getItemCountAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_count',
  outputSchema: podioCountObjectTasksOutputSchema,
  displayName: 'Get Item Count',
  description: 'Counts the items of an app that match a saved view or filters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Counts an app\'s items matching a saved view and/or filters without returning them. Filter values are strings: "1;2" for lists, "20-100" or "2026-01-01-2026-06-30" for ranges, "user:1" for created_by. The app id comes from List Apps in Space, view ids from List Views and field ids from Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps in Space or Get App.' }),
    viewId: podioAiProps.id({ required: false, displayName: 'View ID', description: 'The id of a saved view to apply, from List Views; "0" applies the last used view.' }),
    filters: podioAiProps.json({
      required: false,
      displayName: 'Filters',
      description: 'Filters keyed by field id or a built-in key, as strings, e.g. {"876": "null;active", "created_on": "2026-01-01-2026-06-30", "created_by": "user:1"}.',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/item/app/${propsValue.appId}/count`,
      query: podioUtils.query({ values: { ...filtersToQuery({ filters: propsValue.filters }), view_id: propsValue.viewId } }),
    });
  },
});

function filtersToQuery({ filters }: { filters: Record<string, unknown> | undefined }): Record<string, string> {
  return Object.fromEntries(Object.entries(filters ?? {}).map(([key, value]) => [key, String(value)]));
}
