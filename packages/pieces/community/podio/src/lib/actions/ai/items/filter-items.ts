import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioUtils } from '../../../common/utils';
import { podioFilterItemsOutputSchema } from '../../../output-schemas';

export const filterItemsAction = createAction({
  auth: podioAuth,
  name: 'podio_filter_items',
  outputSchema: podioFilterItemsOutputSchema,
  displayName: 'Filter Items',
  description: 'Lists the items of an app that match filters, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of an app\'s items matching the filters, with total and filtered counts; page with offset. Filter keys are field ids or external ids and keys like created_on, created_by or tags. Use Filter Items by View for a saved view. The app id comes from List Apps in Space or Get App, field ids from Get App, and the optional space id from Get Space.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps in Space or Get App.' }),
    filters: podioAiProps.json({
      required: false,
      displayName: 'Filters',
      description: 'Filters keyed by field id, field external id or a built-in key, e.g. {"status": [1, 2], "created_on": {"from": "2026-01-01", "to": "2026-06-30"}, "title": "acme"}.',
    }),
    sortBy: podioAiProps.text({ required: false, displayName: 'Sort By', description: 'What to sort by: a field id, or created_on, last_edit_on, title and the other sort keys of the Podio filter area.' }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending, "false" ascending.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of items to return. Defaults to 30, at most 500.' }),
    offset: podioAiProps.offset({ required: false }),
    remember: podioAiProps.bool({ required: false, displayName: 'Remember', description: '"true" saves these filters as the connected user\'s last used view of the app.' }),
    spaceId: podioAiProps.id({ required: false, displayName: 'Space ID', description: 'The id of the workspace the app is in, from Get Space; filters the items from that space and app.' }),
  },
  async run({ auth, propsValue }) {
    return await podioApi.filterItems({
      auth,
      appId: propsValue.appId,
      spaceId: propsValue.spaceId,
      body: podioUtils.body({
        values: {
          filters: propsValue.filters,
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
