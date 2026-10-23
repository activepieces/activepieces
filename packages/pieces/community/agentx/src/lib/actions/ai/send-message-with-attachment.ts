import { createAction, Property } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxAiProps } from '../../common/ai-props';
import { agentxApi } from '../../common/api';

export const sendMessageWithAttachmentAction = createAction({
  auth: agentxAuth,
  name: 'agentx_send_message_with_attachment',
  displayName: 'Send Message With Attachment',
  description:
    'Sends a file, with an optional message, to an AgentX conversation and returns the agent reply.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Uploads a file with an optional text message into an existing AgentX conversation (ID from Create Conversation or List Conversations) and returns each agent's reply. Use Send Message when there is no file. Every call adds a new message and reply.",
    idempotent: false,
  },
  props: {
    conversationId: agentxAiProps.conversationId({ required: true }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to attach, as a URL or base64 content.',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Optional message text sent with the file.',
      required: false,
    }),
    context: agentxAiProps.context({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { conversationId, file, message, context } = propsValue;
    return await agentxApi.sendMessageWithAttachment({
      auth,
      conversationId,
      file,
      message,
      context,
    });
  },
});
