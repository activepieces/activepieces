import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const archiveChannelAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_archive_channel',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Archive Channel',
  description: 'Archives a public or private channel.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Archives (soft-deletes) a public or private channel: it becomes read-only and hidden, and its messages are kept. Restore Channel reverses it; nothing is permanently deleted. Direct and group messages cannot be archived.',
    idempotent: false,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/channels/${encodeURIComponent(context.propsValue.channelId)}`,
    });
  },
});
