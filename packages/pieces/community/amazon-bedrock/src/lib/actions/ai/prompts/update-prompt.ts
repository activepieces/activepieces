import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { GetPromptCommand, PromptVariant, UpdatePromptCommand } from '@aws-sdk/client-bedrock-agent';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockCreatePromptVersionOutputSchema } from '../../../output-schemas';

export const amazonBedrockUpdatePrompt = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_update_prompt',
  outputSchema: amazonBedrockCreatePromptVersionOutputSchema,
  displayName: 'Update Prompt',
  description: 'Changes the working draft of a saved prompt.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates the working DRAFT of an Amazon Bedrock prompt, by the id or ARN from Create Prompt or List Prompts; only the fields you set change, and the template, model and inference settings apply to its default variant. Write template variables in single braces ({ticket}), which Bedrock stores as {{ticket}}. Published versions never change: use Create Prompt Version afterwards to publish the new DRAFT.',
    idempotent: true,
  },
  props: {
    promptId: Property.ShortText({
      displayName: 'Prompt ID',
      description: 'The id or ARN of the prompt, from Create Prompt or List Prompts.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A new unique name for the prompt (letters, numbers, hyphens and underscores).',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A new description of what the prompt is for.',
      required: false,
    }),
    template: Property.LongText({
      displayName: 'Template',
      description: 'The new prompt text, replacing the current one. Write each variable in single braces, e.g. "Summarize this ticket in one line: {ticket}"; it is saved as Bedrock\'s {{ticket}}.',
      required: false,
    }),
    modelId: Property.ShortText({
      displayName: 'Model ID',
      description: 'The model the prompt runs on, a modelId from List Foundation Models or an inferenceProfileId.',
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
    const { promptId, name, description, template, modelId, maxTokens, temperature } = propsValue;
    const client = await bedrockAi.agent({ auth: auth.props, server });
    const current = await client.send(new GetPromptCommand({ promptIdentifier: promptId }));
    const changesVariant = Boolean(template) || Boolean(modelId) || !isNil(maxTokens) || !isNil(temperature);
    if (changesVariant && !current.variants?.some((variant) => variant.name === current.defaultVariant)) {
      throw new Error(
        `Prompt ${promptId} has no default variant to apply Template, Model ID, Max Tokens or Temperature to; edit its variants in the AWS console.`,
      );
    }
    const response = await client.send(
      new UpdatePromptCommand({
        promptIdentifier: promptId,
        name: name || current.name,
        description: description || current.description,
        customerEncryptionKeyArn: current.customerEncryptionKeyArn,
        defaultVariant: current.defaultVariant,
        variants: current.variants?.map((variant) =>
          variant.name === current.defaultVariant
            ? mergeVariant({ variant, template, modelId, maxTokens, temperature })
            : variant,
        ),
      }),
    );
    return bedrockAi.body(response);
  },
});

function mergeVariant({
  variant,
  template,
  modelId,
  maxTokens,
  temperature,
}: {
  variant: PromptVariant;
  template: string | undefined;
  modelId: string | undefined;
  maxTokens: number | undefined;
  temperature: number | undefined;
}): PromptVariant {
  if (template && variant.templateType !== 'TEXT') {
    throw new Error(
      `Template can only replace a TEXT prompt; the default variant "${variant.name}" is ${variant.templateType}. Edit it in the AWS console.`,
    );
  }
  const inference = variant.inferenceConfiguration?.text;
  return {
    ...variant,
    templateConfiguration: template
      ? { text: { ...variant.templateConfiguration?.text, ...bedrockAi.promptTemplate(template) } }
      : variant.templateConfiguration,
    modelId: modelId || variant.modelId,
    inferenceConfiguration:
      isNil(maxTokens) && isNil(temperature)
        ? variant.inferenceConfiguration
        : {
            text: {
              ...inference,
              maxTokens: maxTokens ?? inference?.maxTokens,
              temperature: temperature ?? inference?.temperature,
            },
          },
  };
}
