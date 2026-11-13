import { createAction, Property } from '@activepieces/pieces-framework';
import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockConverseOutputSchema } from '../../../output-schemas';

export const amazonBedrockConverse = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_converse',
  outputSchema: amazonBedrockConverseOutputSchema,
  displayName: 'Converse',
  description: 'Sends a conversation to a Bedrock model and returns its reply.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Calls the Amazon Bedrock Converse API with a model, inference profile, prompt router or managed prompt and returns the model\'s reply message, stop reason and token usage. Supports prior messages, a system prompt, tool definitions, a guardrail and prompt variables; pick it over Ask Bedrock when you need tools, multi-turn history or a managed prompt from List Prompts (pass its version ARN from Create Prompt Version as the model id, fill promptVariables, and leave the system prompt, inference settings and tools empty: the prompt supplies them). Get model ids from List Foundation Models or List Inference Profiles. Not idempotent: each call bills a new, non-deterministic completion.',
    idempotent: false,
  },
  props: {
    modelId: Property.ShortText({
      displayName: 'Model ID',
      description:
        'A modelId from List Foundation Models, an inferenceProfileId from List Inference Profiles, a promptRouterArn, or a prompt version ARN from Create Prompt Version.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The new user message. Appended after Messages when both are set.',
      required: false,
    }),
    messages: Property.Json({
      displayName: 'Messages',
      description:
        'Earlier turns as a JSON array of Converse messages, e.g. [{"role": "user", "content": [{"text": "Hi"}]}, {"role": "assistant", "content": [{"text": "Hello"}]}]. Use it to send tool results back too.',
      required: false,
    }),
    system: Property.LongText({
      displayName: 'System Prompt',
      description: 'Instructions that set the model\'s behaviour.',
      required: false,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'The maximum number of tokens to generate.',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Randomness between 0 and 1.',
      required: false,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      description: 'Nucleus sampling between 0 and 1.',
      required: false,
    }),
    stopSequences: Property.Array({
      displayName: 'Stop Sequences',
      description: 'Strings that stop generation when produced.',
      required: false,
    }),
    toolConfig: Property.Json({
      displayName: 'Tool Configuration',
      description:
        'Tools the model may call, as a Converse toolConfig object: {"tools": [{"toolSpec": {"name": "...", "description": "...", "inputSchema": {"json": {...}}}}], "toolChoice": {"auto": {}}}.',
      required: false,
    }),
    guardrailId: Property.ShortText({
      displayName: 'Guardrail ID',
      description: 'The id or ARN of a guardrail set up in the Amazon Bedrock console, to apply to this call.',
      required: false,
    }),
    guardrailVersion: Property.ShortText({
      displayName: 'Guardrail Version',
      description: 'The guardrail version, e.g. "1", or "DRAFT". Required with Guardrail ID.',
      required: false,
    }),
    promptVariables: Property.Object({
      displayName: 'Prompt Variables',
      description: 'Values for the {{variables}} of a managed prompt, as name → text.',
      required: false,
    }),
    additionalModelRequestFields: Property.Json({
      displayName: 'Additional Model Request Fields',
      description: 'Model-specific parameters Converse does not cover, e.g. {"top_k": 50}.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const { guardrailId, guardrailVersion, promptVariables, stopSequences } = propsValue;
    if (Boolean(guardrailId) !== Boolean(guardrailVersion)) {
      throw new Error('Guardrail ID and Guardrail Version must be set together.');
    }
    const inferenceConfig = {
      maxTokens: propsValue.maxTokens ?? undefined,
      temperature: propsValue.temperature ?? undefined,
      topP: propsValue.topP ?? undefined,
      stopSequences: stopSequences && stopSequences.length > 0 ? stopSequences.map(String) : undefined,
    };
    const hasInferenceConfig = Object.values(inferenceConfig).some((value) => value !== undefined);
    const system = bedrockAi.systemBlocks(propsValue.system);
    const toolConfig = bedrockAi.toolConfig(propsValue.toolConfig);
    const additionalModelRequestFields = bedrockAi.document(propsValue.additionalModelRequestFields);
    if (MANAGED_PROMPT_ARN.test(propsValue.modelId) && (hasInferenceConfig || system || toolConfig || additionalModelRequestFields)) {
      throw new Error(
        'A managed prompt sets its own system prompt, inference settings and tools: leave System Prompt, Max Tokens, Temperature, Top P, Stop Sequences, Tool Configuration and Additional Model Request Fields empty.',
      );
    }
    const messages = bedrockAi.conversation({ prompt: propsValue.prompt, messages: propsValue.messages });
    const variables = Object.entries(promptVariables ?? {});
    const client = await bedrockAi.runtime({ auth: auth.props, server });
    const response = await client.send(
      new ConverseCommand({
        modelId: propsValue.modelId,
        messages: messages.length > 0 ? messages : undefined,
        system,
        inferenceConfig: hasInferenceConfig ? inferenceConfig : undefined,
        toolConfig,
        guardrailConfig: guardrailId && guardrailVersion ? { guardrailIdentifier: guardrailId, guardrailVersion } : undefined,
        promptVariables:
          variables.length > 0 ? Object.fromEntries(variables.map(([name, value]) => [name, { text: String(value) }])) : undefined,
        additionalModelRequestFields,
      }),
    );
    return bedrockAi.body(response);
  },
});

const MANAGED_PROMPT_ARN = /^arn:aws[\w-]*:bedrock:[^:]*:\d*:prompt\//;
