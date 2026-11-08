import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetSpaceOutputSchema } from '../../../output-schemas';

export const getSpaceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_space',
  outputSchema: podioGetSpaceOutputSchema,
  displayName: 'Get Space',
  description: 'Gets one workspace by id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one workspace: name, url, privacy, auto-join and announcement settings, and the user\'s role and rights in it. The space id comes from List Organization Spaces, List Organizations or Get Top Spaces.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace, from List Organization Spaces, List Organizations or Get Top Spaces.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/space/${propsValue.spaceId}` });
  },
});
