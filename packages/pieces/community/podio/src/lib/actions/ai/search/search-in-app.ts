import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioSearchByAppInSpaceOutputSchema } from '../../../output-schemas';

export const searchInAppAction = createAction({
  auth: podioAuth,
  name: 'podio_search_in_app',
  outputSchema: podioSearchByAppInSpaceOutputSchema,
  displayName: 'Search In App',
  description: 'Searches the items, files and tasks of an app.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches the items, files and tasks of one Podio app, most recently updated first, up to 20 per call. Use Filter Items to match on field values instead of text. The app id comes from List Apps In Space.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps In Space.' }),
    query: podioAiProps.text({ required: true, displayName: 'Query', description: 'The text to search for.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of results to return, up to 20. Defaults to 20.' }),
    offset: podioAiProps.offset({ required: false }),
    refType: podioAiProps.choice({ required: false, displayName: 'Object Type', description: 'Only results of this type.', values: ['item', 'task', 'file', 'conversation', 'profile', 'app'] }),
    counts: podioAiProps.bool({ required: false, displayName: 'Include Counts', description: '"true" also returns the number of matches per object type. Defaults to "false".' }),
    highlights: podioAiProps.bool({ required: false, displayName: 'Include Highlights', description: '"true" also returns the matching text of each result. Defaults to "false".' }),
    searchFields: podioAiProps.text({ required: false, displayName: 'Search Fields', description: 'Comma-separated fields to search in, such as "title". Defaults to all fields.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/search/app/${propsValue.appId}/v2`,
      query: podioUtils.query({
        values: {
          query: propsValue.query,
          limit: Math.min(propsValue.limit ?? 20, 20),
          offset: propsValue.offset,
          ref_type: propsValue.refType,
          counts: podioUtils.toBool({ value: propsValue.counts }),
          highlights: podioUtils.toBool({ value: propsValue.highlights }),
          search_fields: propsValue.searchFields,
        },
      }),
    });
  },
});
