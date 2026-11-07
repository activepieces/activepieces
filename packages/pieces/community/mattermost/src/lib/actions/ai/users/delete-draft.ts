import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const deleteDraftAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_delete_draft',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Delete Draft',
  description: 'Deletes a user\'s draft in a channel.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a user\'s unsent channel draft for good; pass "me" for the connected account. For a draft reply in a thread use Delete Thread Draft. Needs synced drafts enabled on the server.',
    idempotent: false,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    channelId: mattermostAiProps.channelId({ required: true }),
  },
  async run(context) {
    const { userId, channelId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/users/${encodeURIComponent(userId)}/channels/${encodeURIComponent(channelId)}/drafts`,
    });
  },
});
