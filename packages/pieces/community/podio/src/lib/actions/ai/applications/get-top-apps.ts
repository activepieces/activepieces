import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetTopAppsOutputSchema } from '../../../output-schemas';

export const getTopAppsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_top_apps',
  outputSchema: podioGetTopAppsOutputSchema,
  displayName: 'Get Top Apps',
  description: 'Lists the apps the user has interacted with the most.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio apps the connected user has interacted with the most, across all workspaces. To search apps by name use List Apps; within one organization use Get Top Apps for Organization. Podio returns 4 apps unless Limit is set.',
    idempotent: true,
  },
  props: {
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of apps to return. Podio defaults to 4.' }),
    excludeDemo: podioAiProps.bool({ required: false, displayName: 'Exclude Demo', description: '"true" leaves out apps from the demo workspace. Defaults to "false".' }),
  },
  async run({ auth, propsValue }) {
    const apps = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/app/top/',
      query: podioUtils.query({ values: { limit: propsValue.limit, exclude_demo: podioUtils.toBool({ value: propsValue.excludeDemo }) } }),
    });
    return { apps, count: apps.length };
  },
});
