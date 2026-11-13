import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioSearchByAppInSpaceOutputSchema } from '../../../output-schemas';

export const searchByAppInSpaceAction = createAction({
  auth: podioAuth,
  name: 'podio_search_by_app_in_space',
  outputSchema: podioSearchByAppInSpaceOutputSchema,
  displayName: 'Search By App In Space',
  description: 'Searches the items, files and tasks of an app within a workspace.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches the items, files and tasks of one Podio app within the workspace that holds it, up to 20 per call. Search In App covers the same app without the workspace. The app id comes from List Apps In Space and the space id from List Org Spaces or Get Space.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps In Space.' }),
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space that holds the app, from List Org Spaces or Get Space.' }),
    query: podioAiProps.text({ required: true, displayName: 'Query', description: 'The text to search for.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of results to return, up to 20. Defaults to 20.' }),
    offset: podioAiProps.offset({ required: false }),
    refType: podioAiProps.choice({ required: false, displayName: 'Object Type', description: 'Only results of this type.', values: ['item', 'task', 'conversation', 'app', 'status', 'file', 'profile'] }),
    counts: podioAiProps.bool({ required: false, displayName: 'Include Counts', description: '"true" also returns the number of matches per object type. Defaults to "false".' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/search/app/${propsValue.appId}/space/${propsValue.spaceId}`,
      query: podioUtils.query({
        values: {
          query: propsValue.query,
          limit: Math.min(propsValue.limit ?? 20, 20),
          offset: propsValue.offset,
          ref_type: propsValue.refType,
          counts: podioUtils.toBool({ value: propsValue.counts }),
        },
      }),
    });
  },
});
