import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetRolesByNamesOutputSchema } from '../../../output-schemas';

export const listRolesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_roles',
  outputSchema: mattermostGetRolesByNamesOutputSchema,
  displayName: 'List Roles',
  description: 'Lists every role and its permissions.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every role on the server (system, team and channel roles) with its permissions. Needs a system admin connection.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const roles = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/roles',
    });
    return { roles, count: roles.length };
  },
});
