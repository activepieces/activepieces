import { createAction, Property } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { customerIdProp } from '../common/props';
import { mutateRecord, resourceDefinition, resourceTypeProp, validateOnlyProp } from '../common/records';
import { RESOURCES, RESOURCE_TYPES } from '../common/resources';
import { recordMutationOutputSchema } from '../output-schemas';

function createExamples(): string {
  return RESOURCE_TYPES.map((type) => `**${RESOURCES[type].label}**: \`${JSON.stringify(RESOURCES[type].createExample)}\``).join('\n\n');
}

export const createRecord = createAction({
  name: 'createRecord',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Create a campaign, ad group, ad, keyword or audience list',
  audience: 'both',
  aiMetadata: {
    description:
      'Create one Google Ads campaign, ad group, ad, keyword or audience list from a JSON body in the REST API shape (camelCase, enums as strings, money in micros). Use Update record to change an existing one. Set Validate Only to dry-run. Each call creates a new record, so retries duplicate.',
    idempotent: false,
  },
  auth: googleAdsAuth,
  props: {
    customerId: customerIdProp,
    resourceType: resourceTypeProp,
    record: Property.Json({
      displayName: 'Record',
      description: `Fields of the new record as the Google Ads REST API expects them (camelCase, enums as strings, money in micros as strings). Minimal examples:\n\n${createExamples()}\n\nA campaign needs an existing campaign budget (\`campaignBudgets:mutate\` via Custom API Call).`,
      required: true,
    }),
    validateOnly: validateOnlyProp,
  },
  outputSchema: recordMutationOutputSchema,
  async run(context) {
    const { customerId, resourceType, record, validateOnly } = context.propsValue;
    const def = resourceDefinition(resourceType);
    const body = Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'resourceName'));

    return mutateRecord({ auth: context.auth, customerId, def, operation: { create: body }, validateOnly: Boolean(validateOnly) });
  },
});
