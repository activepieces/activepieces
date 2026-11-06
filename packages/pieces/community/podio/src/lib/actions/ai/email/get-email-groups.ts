import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioGetEmailGroupsOutputSchema } from '../../../output-schemas';

export const getEmailGroupsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_email_groups',
  outputSchema: podioGetEmailGroupsOutputSchema,
  displayName: 'Get Email Groups',
  description: 'Gets which groups of Podio emails the current user receives.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the connected user\'s email subscription settings: whether each group of Podio emails (digest, bulletin, reference, message, space, subscription) is on.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: '/email/group/' });
  },
});
