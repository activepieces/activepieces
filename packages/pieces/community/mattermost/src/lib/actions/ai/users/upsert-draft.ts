import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUpsertDraftOutputSchema } from '../../../output-schemas';

export const upsertDraftAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_upsert_draft',
  outputSchema: mattermostUpsertDraftOutputSchema,
  displayName: 'Save Draft',
  description: 'Creates or replaces the connected user\'s draft in a channel or thread.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Saves an unsent message draft for the connected user in a channel, or in a thread when Root ID is set, replacing the draft already there. Needs synced drafts enabled on the server. To post the message use Create Post.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Draft text, in Markdown.',
      required: true,
    }),
    rootId: mattermostAiProps.postId({
      required: false,
      displayName: 'Root ID',
      description: 'ID of the thread root post, for a draft reply. Leave empty for a channel draft.',
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'Up to 10 file IDs from Upload File, uploaded to the same channel.',
      required: false,
    }),
  },
  async run(context) {
    const { channelId, message, rootId, fileIds } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/drafts',
      body: {
        channel_id: channelId,
        message,
        root_id: rootId,
        file_ids: fileIds && fileIds.length > 0 ? fileIds : undefined,
      },
    });
  },
});
