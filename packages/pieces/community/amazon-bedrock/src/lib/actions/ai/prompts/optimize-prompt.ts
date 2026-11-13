import { createAction, Property, tryCatch } from '@activepieces/pieces-framework';
import { OptimizePromptCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockOptimizePromptOutputSchema } from '../../../output-schemas';

export const amazonBedrockOptimizePrompt = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_optimize_prompt',
  outputSchema: amazonBedrockOptimizePromptOutputSchema,
  displayName: 'Optimize Prompt',
  description: 'Rewrites a prompt to work better with a chosen model.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Has Amazon Bedrock analyze a prompt and rewrite it for a target model, returning the optimized prompt text and the analysis behind it. The target is a modelId from List Foundation Models that supports prompt optimization; the result can be saved with Create Prompt or Update Prompt. Not idempotent: each call bills a new, non-deterministic rewrite.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The prompt text to optimize.',
      required: true,
    }),
    targetModelId: Property.ShortText({
      displayName: 'Target Model ID',
      description: 'The modelId from List Foundation Models to optimize the prompt for, e.g. "anthropic.claude-3-5-sonnet-20240620-v1:0".',
      required: true,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.agentRuntime({ auth: auth.props, server });
    const response = await client.send(
      new OptimizePromptCommand({
        input: { textPrompt: { text: propsValue.prompt } },
        targetModelId: propsValue.targetModelId,
      }),
    );
    const optimized: string[] = [];
    const analysis: string[] = [];
    for await (const event of response.optimizedPrompt ?? []) {
      const text = event.optimizedPromptEvent?.optimizedPrompt?.textPrompt?.text;
      if (text) {
        optimized.push(text);
      }
      const message = event.analyzePromptEvent?.message;
      if (message) {
        analysis.push(message);
      }
    }
    if (optimized.length === 0) {
      throw new Error('Bedrock ended the optimization stream without an optimized prompt.');
    }
    return { optimizedPrompt: await decodeQuoted(optimized.join('')), analysis: analysis.join('\n') };
  },
});

async function decodeQuoted(text: string): Promise<string> {
  if (!(text.startsWith('"') && text.endsWith('"'))) {
    return text;
  }
  const { data } = await tryCatch<unknown>(async () => JSON.parse(text));
  return typeof data === 'string' ? data : text;
}
