import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { CreatePromptCommand } from '@aws-sdk/client-bedrock-agent';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockCreatePromptOutputSchema } from '../../../output-schemas';

export const amazonBedrockCreatePrompt = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_create_prompt',
  outputSchema: amazonBedrockCreatePromptOutputSchema,
  displayName: 'Create Prompt',
  description: 'Saves a reusable prompt template in Bedrock Prompt Management.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a prompt in Amazon Bedrock Prompt Management as a working DRAFT with one text template; write its variables in single braces ({ticket}), which Bedrock stores as {{ticket}} and fills at run time. Returns its id and ARN: pass the ARN as the model id in Converse with promptVariables to run it, and use Create Prompt Version to publish an immutable version. Not idempotent: each call creates a new prompt, even with the same name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A unique name for the prompt (letters, numbers, hyphens and underscores).',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'What the prompt is for.',
      required: false,
    }),
    template: Property.LongText({
      displayName: 'Template',
      description: 'The prompt text. Write each variable in single braces, e.g. "Summarize this ticket in one line: {ticket}"; it is saved as Bedrock\'s {{ticket}}.',
      required: true,
    }),
    modelId: Property.ShortText({
      displayName: 'Model ID',
      description: 'The model the prompt runs on, a modelId from List Foundation Models or an inferenceProfileId. Required to run the prompt through Converse.',
      required: false,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'The maximum number of tokens the model generates.',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Randomness between 0 and 1.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const { name, description, template, modelId, maxTokens, temperature } = propsValue;
    const client = await bedrockAi.agent({ auth: auth.props, server });
    const response = await client.send(
      new CreatePromptCommand({
        name,
        description: description || undefined,
        defaultVariant: VARIANT_NAME,
        variants: [
          {
            name: VARIANT_NAME,
            templateType: 'TEXT',
            templateConfiguration: { text: bedrockAi.promptTemplate(template) },
            modelId: modelId || undefined,
            inferenceConfiguration:
              isNil(maxTokens) && isNil(temperature)
                ? undefined
                : { text: { maxTokens: maxTokens ?? undefined, temperature: temperature ?? undefined } },
          },
        ],
      }),
    );
    return bedrockAi.body(response);
  },
});

const VARIANT_NAME = 'default';
