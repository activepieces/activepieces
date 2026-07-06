import { createAction, Property } from '@activepieces/pieces-framework';
import { customgptAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { projectId } from '../common/props';

export const createConversation = createAction({
  auth: customgptAuth,
  name: 'createConversation',
  displayName: 'Create Conversation',
  description: 'Create a new conversation in a CustomGPT project',
  audience: 'both',
  aiMetadata: {
    description:
      'Opens a new conversation (chat session) inside an existing CustomGPT agent, returning a session identifier used to send messages. Use this before sending the first message in a fresh chat thread; the target agent project is required and the conversation name is optional. Not idempotent: each call starts a new conversation.',
    idempotent: false,
  },
  props: {
    projectId: projectId,
    name: Property.ShortText({
      displayName: 'Conversation Name',
      description: 'Optional name for the conversation',
      required: false,
    }),
  },
  async run(context) {
    const { projectId, name } = context.propsValue;

    const body: any = {};
    if (name) body.name = name;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/projects/${projectId}/conversations`,
      body
    );

    return response;
  },
});
