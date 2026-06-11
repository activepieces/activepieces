import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { chatsistantAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const sendMessage = createAction({
  auth: chatsistantAuth,
  name: 'sendMessage',
  displayName: 'Send Message',
  description: 'Send a message to a chatbot session',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a user message to a Chatsistant chatbot and returns its streamed reply. Provide the chatbot UUID and the message text; supply a session UUID to continue an existing conversation, or omit it to start a fresh session automatically. Not idempotent — each call appends a new message and generates a new response.',
    idempotent: false,
  },
  props: {
    chatbot_uuid: Property.ShortText({
      displayName: 'Chatbot UUID',
      description: 'The UUID of the chatbot to send the message to',
      required: true,
    }),
    query: Property.LongText({
      displayName: 'Message',
      description: 'The message to send to the chatbot',
      required: true,
    }),
    session_uuid: Property.ShortText({
      displayName: 'Session UUID',
      description: 'The UUID of the session to send the message to',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { chatbot_uuid, session_uuid, query } = propsValue;

    if (!session_uuid) {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.POST,
        `/chatbot/${chatbot_uuid}/session/create`,
        {}
      );
      const session_id = response.uuid;
      const messageResponse = await makeRequest(
        auth.secret_text,
        HttpMethod.POST,
        `/session/${session_id}/message/stream`,
        {
          query,
        }
      );
      return messageResponse;
    } else {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.POST,
        `/session/${session_uuid}/message/stream`,
        {
          query,
        }
      );

      return response;
    }
  },
});
