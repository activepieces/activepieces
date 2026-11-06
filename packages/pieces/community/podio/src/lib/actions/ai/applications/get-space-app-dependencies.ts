import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetAppDependenciesOutputSchema } from '../../../output-schemas';

export const getSpaceAppDependenciesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_space_app_dependencies',
  outputSchema: podioGetAppDependenciesOutputSchema,
  displayName: 'Get Space App Dependencies',
  description: 'Gets the active apps of a workspace with the apps each one depends on.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the active apps in a Podio workspace and, for each, the apps it references one level deep. For the full dependency chain of one app, use Get App Dependencies. The space id comes from List Organizations or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/space/${propsValue.spaceId}/dependencies/` });
  },
});
