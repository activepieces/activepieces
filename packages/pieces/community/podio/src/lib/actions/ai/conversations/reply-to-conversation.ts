import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioReplyToConversationOutputSchema } from '../../../output-schemas';

export const replyToConversationAction = createAction({
  auth: podioAuth,
  name: 'podio_reply_to_conversation',
  outputSchema: podioReplyToConversationOutputSchema,
  displayName: 'Reply To Conversation',
  description: 'Posts a reply in an existing conversation.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Posts a message in an existing Podio conversation and returns the event it creates. The conversation id comes from Get Conversations, Search Conversations or Create Conversation; file ids come from Upload File and embed ids from Create Embed.',
    idempotent: false,
  },
  props: {
    conversationId: podioAiProps.id({ required: true, displayName: 'Conversation ID', description: 'The id of the conversation, from Get Conversations, Search Conversations or Create Conversation.' }),
    text: podioAiProps.longText({ required: true, displayName: 'Message', description: 'The text of the reply.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'File IDs', description: 'Ids of uploaded files to attach to the reply, from Upload File.' }),
    embedId: podioAiProps.id({ required: false, displayName: 'Embed ID', description: 'The id of a link embed to attach, from Create Embed.' }),
    embedUrl: podioAiProps.text({ required: false, displayName: 'Embed URL', description: 'A URL to attach to the reply.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/conversation/${propsValue.conversationId}/reply/v2`,
      body: podioUtils.body({
        values: {
          text: propsValue.text,
          file_ids: propsValue.fileIds?.map((fileId) => Number(fileId)),
          embed_id: propsValue.embedId ? Number(propsValue.embedId) : undefined,
          embed_url: propsValue.embedUrl,
        },
      }),
    });
  },
});
