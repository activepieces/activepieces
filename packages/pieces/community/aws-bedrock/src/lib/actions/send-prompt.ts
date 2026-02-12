import { createAction, Property } from '@activepieces/pieces-framework';
import {
  ConverseCommand,
  ConversationRole,
} from '@aws-sdk/client-bedrock-runtime';
import { awsBedrockAuth } from '../../index';
import {
  createBedrockRuntimeClient,
  getBedrockModelOptions,
} from '../common';

export const sendPrompt = createAction({
  auth: awsBedrockAuth,
  name: 'send_prompt',
  displayName: 'Ask Bedrock',
  description: 'Send a text prompt to an Amazon Bedrock model.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      auth: awsBedrockAuth,
      description: 'The foundation model to use for generation.',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your AWS account first',
            options: [],
          };
        }
        return getBedrockModelOptions(auth.props);
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      required: false,
      description: 'Instructions that guide the model behavior.',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness. Lower values produce more deterministic output.',
      defaultValue: 0.7,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'The maximum number of tokens to generate.',
      defaultValue: 2048,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'Nucleus sampling: the model considers tokens with top_p probability mass.',
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createBedrockRuntimeClient(auth.props);
    const { model, prompt, systemPrompt, temperature, maxTokens, topP } =
      propsValue;

    const response = await client.send(
      new ConverseCommand({
        modelId: model,
        messages: [
          {
            role: ConversationRole.USER,
            content: [{ text: prompt }],
          },
        ],
        ...(systemPrompt
          ? { system: [{ text: systemPrompt }] }
          : {}),
        inferenceConfig: {
          temperature: temperature ?? undefined,
          maxTokens: maxTokens ?? undefined,
          topP: topP ?? undefined,
        },
      })
    );

    const outputMessage = response.output?.message;
    const textContent = outputMessage?.content
      ?.filter((block) => 'text' in block)
      .map((block) => block.text)
      .join('');

    return {
      text: textContent ?? '',
      stopReason: response.stopReason,
      usage: response.usage,
    };
  },
});
