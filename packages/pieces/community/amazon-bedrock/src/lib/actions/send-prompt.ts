import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import {
  ConverseCommand,
  ConversationRole,
  Message,
} from '@aws-sdk/client-bedrock-runtime';
import { awsBedrockAuth } from '../../index';
import {
  createBedrockRuntimeClient,
  getBedrockModelOptions,
  formatBedrockError,
  extractConverseTextResponse,
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
        return getBedrockModelOptions(auth.props, { useInferenceProfiles: true });
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
    stopSequences: Property.Array({
      displayName: 'Stop Sequences',
      required: false,
      description:
        'Sequences that will cause the model to stop generating. Up to 4 sequences.',
    }),
    memoryKey: Property.ShortText({
      displayName: 'Memory Key',
      required: false,
      description:
        'A memory key that will keep the chat history shared across runs and flows. Keep it empty to leave the model without memory of previous messages.',
    }),
  },
  async run({ auth, propsValue, store }) {
    const client = createBedrockRuntimeClient(auth.props);
    const {
      model,
      prompt,
      systemPrompt,
      temperature,
      maxTokens,
      topP,
      stopSequences,
      memoryKey,
    } = propsValue;

    let messageHistory: Message[] = [];
    if (memoryKey) {
      messageHistory =
        (await store.get<Message[]>(memoryKey, StoreScope.PROJECT)) ?? [];
    }

    messageHistory.push({
      role: ConversationRole.USER,
      content: [{ text: prompt }],
    });

    try {
      const response = await client.send(
        new ConverseCommand({
          modelId: model,
          messages: messageHistory,
          ...(systemPrompt ? { system: [{ text: systemPrompt }] } : {}),
          inferenceConfig: {
            temperature: temperature ?? undefined,
            maxTokens: maxTokens ?? undefined,
            topP: topP ?? undefined,
            stopSequences:
              stopSequences && stopSequences.length > 0
                ? (stopSequences as string[])
                : undefined,
          },
        })
      );

      const outputMessage = response.output?.message;
      if (outputMessage) {
        messageHistory.push(outputMessage);
      }

      if (memoryKey) {
        await store.put(memoryKey, messageHistory, StoreScope.PROJECT);
      }

      return extractConverseTextResponse(response);
    } catch (error) {
      throw new Error(formatBedrockError(error));
    }
  },
});
