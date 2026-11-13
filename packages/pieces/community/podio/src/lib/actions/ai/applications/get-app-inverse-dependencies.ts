import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetAppInverseDependenciesOutputSchema } from '../../../output-schemas';

export const getAppInverseDependenciesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app_inverse_dependencies',
  outputSchema: podioGetAppInverseDependenciesOutputSchema,
  displayName: 'Get App Inverse Dependencies',
  description: 'Gets the apps, in any workspace, that have a field referencing an app.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists every app, in all workspaces, with a relationship field that references the given Podio app, with the id of that field. Check it before deleting or changing an app; for the apps this app itself references, use Get App Dependencies. The app id comes from List Apps, List Apps in Space or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the referenced app.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/app/${propsValue.appId}/inverse_dependencies/` });
  },
});
