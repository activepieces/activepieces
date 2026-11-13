import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetConversationsOnObjectOutputSchema } from '../../../output-schemas';

export const getConversationsOnObjectAction = createAction({
  auth: podioAuth,
  name: 'podio_get_conversations_on_object',
  outputSchema: podioGetConversationsOnObjectOutputSchema,
  displayName: 'Get Conversations On Object',
  description: 'Lists your conversations attached to an object such as an item, task or status.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio conversations attached to one object, such as an item, task or status, that the connected user takes part in. The object id comes from Get Item, Get Task or Get Status.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "task" or "status".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from Get Item, Get Task or Get Status.' }),
  },
  async run({ auth, propsValue }) {
    const conversations = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/conversation/${propsValue.refType}/${propsValue.refId}/` });
    return { conversations, count: conversations.length };
  },
});
