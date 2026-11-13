import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateConversationOutputSchema } from '../../../output-schemas';

export const createConversationAction = createAction({
  auth: podioAuth,
  name: 'podio_create_conversation',
  outputSchema: podioCreateConversationOutputSchema,
  displayName: 'Create Conversation',
  description: 'Starts a new private conversation with a list of users.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a new private Podio conversation (a direct message thread) with the given users and posts its first message. To start a conversation attached to an item, task or status use Create Conversation On Object; to post in an existing one use Reply To Conversation. User ids come from List Space Members or Get Organization Members, file ids from Upload File, embed ids from Create Embed.',
    idempotent: false,
  },
  props: {
    subject: podioAiProps.text({ required: true, displayName: 'Subject', description: 'The subject of the conversation.' }),
    text: podioAiProps.longText({ required: true, displayName: 'Message', description: 'The text of the first message.' }),
    participants: podioAiProps.idList({ required: true, displayName: 'Participant User IDs', description: 'The user ids of the people in the conversation, not including yourself.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'File IDs', description: 'Ids of uploaded files to attach to the first message, from Upload File.' }),
    embedId: podioAiProps.id({ required: false, displayName: 'Embed ID', description: 'The id of a link embed to attach, from Create Embed.' }),
    embedUrl: podioAiProps.text({ required: false, displayName: 'Embed URL', description: 'A URL to attach to the first message.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/conversation/v2/',
      body: podioUtils.body({
        values: {
          subject: propsValue.subject,
          text: propsValue.text,
          participants: propsValue.participants.map((userId) => Number(userId)),
          file_ids: propsValue.fileIds?.map((fileId) => Number(fileId)),
          embed_id: propsValue.embedId ? Number(propsValue.embedId) : undefined,
          embed_url: propsValue.embedUrl,
        },
      }),
    });
  },
});
