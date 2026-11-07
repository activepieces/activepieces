import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateConversationOnObjectOutputSchema } from '../../../output-schemas';

export const createConversationOnObjectAction = createAction({
  auth: podioAuth,
  name: 'podio_create_conversation_on_object',
  outputSchema: podioCreateConversationOnObjectOutputSchema,
  displayName: 'Create Conversation On Object',
  description: 'Starts a new private conversation attached to an object such as an item, task or status.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a new private Podio conversation attached to an object, such as an item, task or status, with the given users. For a conversation not tied to an object use Create Conversation. User ids come from List Space Members or Get Organization Members, file ids from Upload File, embed ids from Create Embed.',
    idempotent: false,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object to attach the conversation to, such as "item", "task" or "status".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from Get Item, Get Task or Get Status.' }),
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
      path: `/conversation/${propsValue.refType}/${propsValue.refId}/`,
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
