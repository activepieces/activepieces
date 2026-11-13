import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieFields } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieCreateOpportunityAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_opportunity',
  classification: 'WRITE',
  displayName: 'Create Opportunity',
  description: 'Add a deal to the sales pipeline.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a Moxie pipeline opportunity with client and stage picked from lists. For agents use moxie_opportunity_create. Not idempotent: each run creates another opportunity.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.opportunity,
  props: {
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Name of the deal.',
      required: true,
    }),
    clientName: moxieDropdowns.clientName({ required: false, description: 'The client this deal is for. Leave empty for none.' }),
    stageName: moxieDropdowns.pipelineStage({ required: false, valueKey: 'label', description: 'Leave empty for the default stage.' }),
    ...moxieProps.fromSpecs({ specs: moxieFields.opportunityCreate, audience: 'human' }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createOpportunity({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
