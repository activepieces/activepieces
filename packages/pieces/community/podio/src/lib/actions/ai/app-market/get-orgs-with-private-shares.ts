import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioGetOrgsWithPrivateSharesOutputSchema } from '../../../output-schemas';

export const getOrgsWithPrivateSharesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_orgs_with_private_shares',
  outputSchema: podioGetOrgsWithPrivateSharesOutputSchema,
  displayName: 'Get Orgs With Private Shares',
  description: 'Lists the organizations of the user that have shared private apps.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the Podio organizations the user is a member of that have shared private apps or packs in the app market.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: '/app_store/org/' });
    return { orgs: body, count: body.length };
  },
});
