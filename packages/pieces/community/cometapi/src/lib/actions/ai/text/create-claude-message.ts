import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiCreateClaudeMessageOutputSchema } from '../../../output-schemas';

export const createClaudeMessageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_create_claude_message',
  outputSchema: cometapiCreateClaudeMessageOutputSchema,
  displayName: 'Create Claude Message',
  description:
    'Generates a reply with a Claude model using the Anthropic Messages format.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Runs an Anthropic Messages API request on a Claude model through CometAPI, with alternating user and assistant turns and an optional system prompt; Max Tokens is required by the format. Use it for Claude-specific features (extended thinking, Claude tool use) passed through Additional Fields; Messages takes text turns only, so for tool_use/tool_result or image blocks leave Messages empty and pass the full messages array in Additional Fields; for other vendors use Create Chat Completion. Each call runs a fresh, billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description:
        'Claude model ID, e.g. "claude-haiku-4-5". Use List Models to find one.',
    }),
    messages: cometApiAiProps.messages({
      roles: ['user', 'assistant'],
      description:
        'The conversation so far, oldest first, alternating user and assistant and starting with user.',
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Upper limit on generated tokens.',
      required: true,
    }),
    system: Property.LongText({
      displayName: 'System Prompt',
      required: false,
    }),
    temperature: cometApiAiProps.temperature({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { messages } = propsValue;
    const body = cometApiUtils.withAdditionalFields({
      additionalFields: propsValue.additionalFields,
      fields: {
        model: propsValue.model,
        messages: messages && messages.length > 0 ? messages : undefined,
        max_tokens: propsValue.maxTokens,
        system: propsValue.system,
        temperature: propsValue.temperature,
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
      path: '/messages',
      body,
    });
  },
});
