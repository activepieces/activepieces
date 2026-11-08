import { createAction, Property } from '@activepieces/pieces-framework';
import { CountTokensCommand } from '@aws-sdk/client-bedrock-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockCountTokensOutputSchema } from '../../../output-schemas';

export const amazonBedrockCountTokens = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_count_tokens',
  outputSchema: amazonBedrockCountTokensOutputSchema,
  displayName: 'Count Tokens',
  description: 'Counts the input tokens a conversation would use for a model.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Counts how many input tokens a Converse request would use for a model, without running it or billing tokens, to check a prompt fits the context window or to estimate cost. Takes the same prompt, messages and system prompt as Converse. Only some models support it (e.g. Anthropic Claude Sonnet 4.6 and Opus 4.5; not every newer model); the model id must be a foundation modelId from List Foundation Models, not an inference profile.',
    idempotent: true,
  },
  props: {
    modelId: Property.ShortText({
      displayName: 'Model ID',
      description: 'A foundation modelId from List Foundation Models, e.g. "anthropic.claude-sonnet-4-6".',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The user message to count. Appended after Messages when both are set.',
      required: false,
    }),
    messages: Property.Json({
      displayName: 'Messages',
      description: 'Earlier turns as a JSON array of Converse messages, as in Converse.',
      required: false,
    }),
    system: Property.LongText({
      displayName: 'System Prompt',
      description: 'The system prompt to include in the count.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const messages = bedrockAi.conversation({ prompt: propsValue.prompt, messages: propsValue.messages });
    if (messages.length === 0) {
      throw new Error('Set Prompt or Messages.');
    }
    const client = await bedrockAi.runtime({ auth: auth.props, server });
    const response = await client.send(
      new CountTokensCommand({
        modelId: propsValue.modelId,
        input: { converse: { messages, system: bedrockAi.systemBlocks(propsValue.system) } },
      }),
    );
    return bedrockAi.body(response);
  },
});
