import { createAction, Property } from '@activepieces/pieces-framework';
import {
  InferenceType,
  ListFoundationModelsCommand,
  ModelCustomization,
  ModelModality,
} from '@aws-sdk/client-bedrock';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockListFoundationModelsOutputSchema } from '../../../output-schemas';

export const amazonBedrockListFoundationModels = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_list_foundation_models',
  outputSchema: amazonBedrockListFoundationModelsOutputSchema,
  displayName: 'List Foundation Models',
  description: 'Lists the foundation models offered in the connected AWS region.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Amazon Bedrock foundation models offered in the connection\'s region, optionally filtered by provider, output modality, inference type or customization type. Returns each model\'s modelId, which Converse, Invoke Model, Count Tokens, Get Foundation Model and Get Foundation Model Availability take; a model listed here may still need access granted, which Get Foundation Model Availability reports. Models that only run through a cross-region inference profile are listed with inference type INFERENCE_PROFILE; call them with an id from List Inference Profiles.',
    idempotent: true,
  },
  props: {
    provider: Property.ShortText({
      displayName: 'Provider',
      description: 'Only models from this provider, e.g. "Amazon", "Anthropic", "Meta", "Mistral AI", "Cohere".',
      required: false,
    }),
    outputModality: Property.StaticDropdown({
      displayName: 'Output Modality',
      description: 'Only models that produce this kind of output.',
      required: false,
      options: bedrockAi.enumOptions(ModelModality),
    }),
    inferenceType: Property.StaticDropdown({
      displayName: 'Inference Type',
      description: 'Only models that support this inference type.',
      required: false,
      options: bedrockAi.enumOptions(InferenceType),
    }),
    customizationType: Property.StaticDropdown({
      displayName: 'Customization Type',
      description: 'Only models that support this kind of customization.',
      required: false,
      options: bedrockAi.enumOptions(ModelCustomization),
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.control({ auth: auth.props, server });
    const response = await client.send(
      new ListFoundationModelsCommand({
        byProvider: propsValue.provider || undefined,
        byOutputModality: bedrockAi.enumValue({ value: propsValue.outputModality, allowed: ModelModality, prop: 'Output Modality' }),
        byInferenceType: bedrockAi.enumValue({ value: propsValue.inferenceType, allowed: InferenceType, prop: 'Inference Type' }),
        byCustomizationType: bedrockAi.enumValue({ value: propsValue.customizationType, allowed: ModelCustomization, prop: 'Customization Type' }),
      }),
    );
    const models = response.modelSummaries ?? [];
    return { models, count: models.length };
  },
});
