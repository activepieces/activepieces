import { createAction, Property } from '@activepieces/pieces-framework';
import { ListEnforcedGuardrailsConfigurationCommand } from '@aws-sdk/client-bedrock';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockListEnforcedGuardrailConfigurationsOutputSchema } from '../../../output-schemas';

export const amazonBedrockListEnforcedGuardrailConfigurations = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_list_enforced_guardrail_configurations',
  outputSchema: amazonBedrockListEnforcedGuardrailConfigurationsOutputSchema,
  displayName: 'List Enforced Guardrail Configurations',
  description: 'Lists the guardrails the account enforces on every model call.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the account-level enforced guardrail configurations for the connection\'s region: guardrails AWS applies automatically to every inference call in the account, on top of any guardrail a call names. An empty list means none is enforced. Read-only; this piece cannot change them. Pass nextToken to continue.',
    idempotent: true,
  },
  props: {
    nextToken: Property.ShortText({
      displayName: 'Next Token',
      description: 'The nextToken from a previous call, to get the next page.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.control({ auth: auth.props, server });
    const response = await client.send(
      new ListEnforcedGuardrailsConfigurationCommand({ nextToken: propsValue.nextToken || undefined }),
    );
    const configurations = response.guardrailsConfig ?? [];
    return { configurations, count: configurations.length, nextToken: response.nextToken ?? null };
  },
});
