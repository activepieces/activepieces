import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioGetInboxNewCountOutputSchema } from '../../../output-schemas';

export const getInboxNewCountAction = createAction({
  auth: podioAuth,
  name: 'podio_get_inbox_new_count',
  outputSchema: podioGetInboxNewCountOutputSchema,
  displayName: 'Get Inbox New Count',
  description: 'Counts your unread notifications.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many unviewed notifications are in the connected user\'s Podio inbox. To list them use Get Notifications with Viewed set to "false".',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: '/notification/inbox/new/count' });
  },
});
