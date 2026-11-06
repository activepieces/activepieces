import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetAppDependenciesOutputSchema } from '../../../output-schemas';

export const getAppDependenciesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app_dependencies',
  outputSchema: podioGetAppDependenciesOutputSchema,
  displayName: 'Get App Dependencies',
  description: 'Gets the apps an app depends on through its relationship fields, directly or indirectly.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the apps a Podio app depends on, directly or indirectly, through its relationship fields, with the dependency graph between them. For the apps that reference this app, use Get App Inverse Dependencies. The app id comes from List Apps, List Apps in Space or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/app/${propsValue.appId}/dependencies/` });
  },
});
