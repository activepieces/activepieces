import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioListViewsOutputSchema } from '../../../output-schemas';

export const listViewsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_views',
  outputSchema: podioListViewsOutputSchema,
  displayName: 'List Views',
  description: 'Lists the views of an app.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the saved views of a Podio app with their ids, names, creators and item counts; standard views are included only when Include Standard Views is "true". The app id comes from List Apps or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app.' }),
    includeStandardViews: podioAiProps.bool({
      required: false,
      displayName: 'Include Standard Views',
      description: '"true" also returns the standard views Podio provides. Defaults to "false".',
    }),
  },
  async run({ auth, propsValue }) {
    const views = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/view/app/${propsValue.appId}/`,
      query: podioUtils.query({ values: { include_standard_views: podioUtils.toBool({ value: propsValue.includeStandardViews }) } }),
    });
    return { views, count: views.length };
  },
});
