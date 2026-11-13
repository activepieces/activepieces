import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const clearCustomStatusAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_clear_custom_status',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Clear Custom Status',
  description: 'Removes the connected user\'s custom status message.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes the connected user\'s current custom status; it stays in their recent custom statuses. Only works for the connected account. To set one use Set Custom Status.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: '/users/me/status/custom',
    });
  },
});
