import { createAction, Property } from '@activepieces/pieces-framework';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockInvokeModelOutputSchema } from '../../../output-schemas';

export const amazonBedrockInvokeModel = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_invoke_model',
  outputSchema: amazonBedrockInvokeModelOutputSchema,
  displayName: 'Invoke Model',
  description: 'Calls a Bedrock model with its own native JSON request body.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Calls an Amazon Bedrock model with the model provider\'s native JSON request body and returns the parsed JSON response, for features Converse does not expose (e.g. embeddings with model-specific options, image models, rerank models). The body format differs per provider; see the model\'s Bedrock documentation. Prefer Converse for chat and text generation. Not idempotent: each call bills a new invocation.',
    idempotent: false,
  },
  props: {
    modelId: Property.ShortText({
      displayName: 'Model ID',
      description: 'A modelId from List Foundation Models or an inferenceProfileId from List Inference Profiles.',
      required: true,
    }),
    body: Property.Json({
      displayName: 'Body',
      description:
        'The model\'s native request body, e.g. {"inputText": "hello"} for Titan Text Embeddings V2, or {"messages": [...], "max_tokens": 512, "anthropic_version": "bedrock-2023-05-31"} for Anthropic models.',
      required: true,
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
  },
  async run({ auth, propsValue, server }) {
    const { guardrailId, guardrailVersion } = propsValue;
    if (Boolean(guardrailId) !== Boolean(guardrailVersion)) {
      throw new Error('Guardrail ID and Guardrail Version must be set together.');
    }
    const client = await bedrockAi.runtime({ auth: auth.props, server });
    const response = await client.send(
      new InvokeModelCommand({
        modelId: propsValue.modelId,
        body: new TextEncoder().encode(JSON.stringify(propsValue.body)),
        contentType: 'application/json',
        accept: 'application/json',
        guardrailIdentifier: guardrailId || undefined,
        guardrailVersion: guardrailVersion || undefined,
      }),
    );
    return {
      body: JSON.parse(new TextDecoder().decode(response.body)),
      contentType: response.contentType ?? null,
    };
  },
});
