import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiCreateChatCompletionOutputSchema } from '../../../output-schemas';

export const createChatCompletionAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_create_chat_completion',
  outputSchema: cometapiCreateChatCompletionOutputSchema,
  displayName: 'Create Chat Completion',
  description:
    'Generates the next message of a conversation with any CometAPI chat model.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Runs an OpenAI-compatible chat completion over a full message history (system, developer, user, assistant and tool turns) on any CometAPI chat model, returning the vendor response with choices and token usage. Use List Models for a model ID; pass tools, response_format or other body fields through Additional Fields. Messages takes text turns only; for image parts, assistant tool_calls or tool results with tool_call_id, leave Messages empty and pass the full messages array in Additional Fields. Each call runs a fresh, billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({ required: true }),
    messages: cometApiAiProps.messages({
      roles: ['system', 'developer', 'user', 'assistant', 'tool'],
    }),
    temperature: cometApiAiProps.temperature({ required: false }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description:
        'Upper limit on generated tokens. Leave empty for the model default.',
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { messages } = propsValue;
    const body = cometApiUtils.withAdditionalFields({
      additionalFields: propsValue.additionalFields,
      fields: {
        model: propsValue.model,
        messages: messages && messages.length > 0 ? messages : undefined,
        temperature: propsValue.temperature,
        max_tokens: propsValue.maxTokens,
      },
    });
    const sentMessages = body['messages'];
    if (!Array.isArray(sentMessages) || sentMessages.length === 0) {
      throw new Error(
        'Give Messages, or structured messages in Additional Fields as {"messages": [{"role": "user", "content": "Hello"}]}.'
      );
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/chat/completions',
      body,
    });
  },
});
