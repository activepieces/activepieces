import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetAvailableSpacesOutputSchema } from '../../../output-schemas';

export const getAvailableSpacesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_available_spaces',
  outputSchema: podioGetAvailableSpacesOutputSchema,
  displayName: 'Get Available Spaces',
  description: 'Lists the open workspaces in an organization that you can join.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the open workspaces in an organization that the user is not in yet and can join. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/space/org/${propsValue.orgId}/available/` });
    return { spaces: body, count: body.length };
  },
});
