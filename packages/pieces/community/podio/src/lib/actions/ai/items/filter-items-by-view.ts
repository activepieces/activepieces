import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioFilterItemsOutputSchema } from '../../../output-schemas';

export const filterItemsByViewAction = createAction({
  auth: podioAuth,
  name: 'podio_filter_items_by_view',
  outputSchema: podioFilterItemsOutputSchema,
  displayName: 'Filter Items by View',
  description: 'Lists the items of an app that match a saved view, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of an app\'s items using the filters and sorting of a saved view, with total and filtered counts; page with offset. Use Filter Items for ad-hoc filters. The app id comes from List Apps in Space and the view id from List Views.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps in Space or Get App.' }),
    viewId: podioAiProps.id({ required: true, displayName: 'View ID', description: 'The id of the saved view, from List Views or Get View.' }),
    sortBy: podioAiProps.text({ required: false, displayName: 'Sort By', description: 'Overrides the view\'s sort: a field id, or created_on, last_edit_on, title and the other Podio sort keys.' }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: 'Overrides the view\'s sort direction: "true" descending, "false" ascending.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of items to return. Defaults to 30, at most 500.' }),
    offset: podioAiProps.offset({ required: false }),
    remember: podioAiProps.bool({ required: false, displayName: 'Remember', description: '"true" saves this view as the connected user\'s last used view of the app.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/item/app/${propsValue.appId}/filter/${propsValue.viewId}/`,
      body: podioUtils.body({
        values: {
          sort_by: propsValue.sortBy,
          sort_desc: podioUtils.toBool({ value: propsValue.sortDesc }),
          limit: Math.min(propsValue.limit ?? 30, 500),
          offset: propsValue.offset ?? undefined,
          remember: podioUtils.toBool({ value: propsValue.remember }),
        },
      }),
    });
  },
});
