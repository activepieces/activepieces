import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetSharedOrganizationsOutputSchema } from '../../../output-schemas';

export const getSharedOrganizationsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_shared_organizations',
  outputSchema: podioGetSharedOrganizationsOutputSchema,
  displayName: 'Get Shared Organizations',
  description: 'Lists the organizations and workspaces you share with another user.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the organizations and workspaces the connected user shares with another user, sorted by name. The user id comes from Get Organization Members or Search Organization Members.',
    idempotent: true,
  },
  props: {
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The id of the other user, from Get Organization Members or Search Organization Members.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/org/shared/${propsValue.userId}` });
    return { organizations: body, count: body.length };
  },
});
