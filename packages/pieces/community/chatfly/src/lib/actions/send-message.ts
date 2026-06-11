import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";
import { chatflyAuth } from '../auth';

export const sendMessageAction = createAction({
  auth: chatflyAuth,
  name: "send_message",
  displayName: "Send Message",
  description: "Send a message to ChatFly bot",
  audience: 'both',
  aiMetadata: { description: 'Send a user message to a ChatFly AI chatbot and get back its streaming chat response. Choose this to query or converse with a deployed ChatFly bot. Requires the target bot ID and a session ID that ties the message to a conversation thread; each call posts a new message, so it is not idempotent.', idempotent: false },
  props: {
    bot_id: Property.ShortText({
      displayName: "Bot ID",
      description: "The ID of your bot",
      required: true,
    }),
    message: Property.LongText({
      displayName: "Message",
      description: "The message to send",
      required: true,
    }),
    session_id: Property.ShortText({
      displayName: "Session ID",
      description: "The ID of the session",
      required: true,
    }),
  },
  async run(context) {
    const { bot_id, message, session_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: "https://backend.chatfly.co/api/chat/get-streaming-response",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      body: {
        bot_id,
        message,
        session_id,
      },
      responseType: 'text'
    });

    return response.body;
  },
});

