import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieOpportunityCreateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_opportunity_create',
  classification: 'WRITE',
  displayName: 'Create Opportunity',
  description: 'Creates a sales pipeline opportunity in Moxie.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a pipeline opportunity (deal) in Moxie, optionally linked to a client by exact name and placed in a stage by exact stage label. Use to log a new deal or lead; get stage labels from List Pipeline Stages. Not idempotent: each call creates a separate opportunity.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.opportunity,
  props: {
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Name of the deal.',
      required: true,
    }),
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact name of the client, from Search Clients. Leave empty for a deal without a client.',
      required: false,
    }),
    stageName: Property.ShortText({
      displayName: 'Stage',
      description: 'Exact pipeline stage label, from List Pipeline Stages. Leave empty for the default stage.',
      required: false,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.opportunityCreate, audience: 'ai' }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createOpportunity({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
