import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const invalidateEmailInvitesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_invalidate_email_invites',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Invalidate Email Invites',
  description: 'Cancels every pending email invitation on the server.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Invalidates every email invitation not yet accepted, across all teams on the server; the links in those emails stop working and cannot be revived. Needs a system admin connection.',
    idempotent: false,
  },
  props: {},
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: '/teams/invites/email',
    });
  },
});
