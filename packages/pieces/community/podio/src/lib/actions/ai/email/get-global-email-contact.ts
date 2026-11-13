import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioGetEmailContactForReferenceOutputSchema } from '../../../output-schemas';

export const getGlobalEmailContactAction = createAction({
  auth: podioAuth,
  name: 'podio_get_global_email_contact',
  outputSchema: podioGetEmailContactForReferenceOutputSchema,
  displayName: 'Get Global Email Contact',
  description: 'Gets the personal task email-in address.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the connected user\'s personal Podio task email-in address (name and mail): sending an email there creates a task. Use Get Email Contact for Reference for the address of a workspace, app or item.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: '/email/contact/task' });
  },
});
