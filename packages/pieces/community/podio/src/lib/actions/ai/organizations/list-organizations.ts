import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioListOrganizationsOutputSchema } from '../../../output-schemas';

export const listOrganizationsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_organizations',
  outputSchema: podioListOrganizationsOutputSchema,
  displayName: 'List Organizations',
  description: 'Lists the organizations, and their workspaces, that you are a member of.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every organization the connected user is a member of, each with the user\'s role and rights and the workspaces in it the user belongs to. This is the source of organization ids and a source of space ids.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: '/org/' });
    return { organizations: body, count: body.length };
  },
});
