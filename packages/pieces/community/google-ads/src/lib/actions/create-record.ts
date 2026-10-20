import { createAction, Property } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { googleAdsApi } from '../common/api';
import { googleAdsProps } from '../common/props';
import { googleAdsUtils } from '../common/utils';
import { recordMutationOutputSchema } from '../output-schemas';

const CREATE_EXAMPLES = googleAdsUtils.resources.map((def) => `**${def.label}**: \`${JSON.stringify(def.createExample)}\``).join('\n\n');

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
    customerId: googleAdsProps.customerId({ required: true }),
    resourceType: googleAdsProps.resourceType({ required: true }),
    record: Property.Json({
      displayName: 'Record',
      description: `Fields of the new record as the Google Ads REST API expects them (camelCase, enums as strings, money in micros as strings). Minimal examples:\n\n${CREATE_EXAMPLES}\n\nA campaign needs an existing campaign budget (\`campaignBudgets:mutate\` via Custom API Call).`,
      required: true,
    }),
    validateOnly: googleAdsProps.validateOnly({ required: false }),
  },
  outputSchema: recordMutationOutputSchema,
  async run(context) {
    const { customerId, resourceType, record, validateOnly } = context.propsValue;
    const def = googleAdsUtils.resourceDefinition(resourceType);
    const body = Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'resourceName'));
    return await googleAdsApi.mutateRecord({ auth: context.auth, customerId, def, operation: { create: body }, validateOnly: Boolean(validateOnly) });
  },
});
