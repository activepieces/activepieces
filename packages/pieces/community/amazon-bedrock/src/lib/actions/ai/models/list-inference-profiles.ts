import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceProfileType, ListInferenceProfilesCommand } from '@aws-sdk/client-bedrock';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockListInferenceProfilesOutputSchema } from '../../../output-schemas';

export const amazonBedrockListInferenceProfiles = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_list_inference_profiles',
  outputSchema: amazonBedrockListInferenceProfilesOutputSchema,
  displayName: 'List Inference Profiles',
  description: 'Lists the inference profiles in the connected region.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Amazon Bedrock inference profiles one page at a time: SYSTEM_DEFINED cross-region profiles (e.g. "us.amazon.nova-micro-v1:0") that many newer models require, and APPLICATION profiles the account created for cost tracking. Each inferenceProfileId works as the model id in Converse and Invoke Model; pass nextToken to continue.',
    idempotent: true,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Only profiles of this type. Leave empty for both.',
      required: false,
      options: bedrockAi.enumOptions(InferenceProfileType),
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of profiles to return (1–1000). Defaults to 50.',
      required: false,
    }),
    nextToken: Property.ShortText({
      displayName: 'Next Token',
      description: 'The nextToken from a previous call, to get the next page.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.control({ auth: auth.props, server });
    const response = await client.send(
      new ListInferenceProfilesCommand({
        typeEquals: bedrockAi.enumValue({ value: propsValue.type, allowed: InferenceProfileType, prop: 'Type' }),
        maxResults: bedrockAi.clampLimit({ limit: propsValue.limit, max: 1000 }),
        nextToken: propsValue.nextToken || undefined,
      }),
    );
    const inferenceProfiles = response.inferenceProfileSummaries ?? [];
    return { inferenceProfiles, count: inferenceProfiles.length, nextToken: response.nextToken ?? null };
  },
});
