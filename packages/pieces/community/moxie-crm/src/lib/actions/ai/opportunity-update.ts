import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieOpportunityUpdateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_opportunity_update',
  classification: 'WRITE',
  displayName: 'Update Opportunity',
  description: 'Updates an existing Moxie opportunity, including its pipeline stage.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing Moxie opportunity by id; set Stage ID to move the deal through the pipeline, or change value, dates, sentiment, client or archive state. Only the fields you pass change. The opportunity id comes from Create Opportunity or an opportunity trigger (there is no search). Idempotent: repeating the same update leaves the deal unchanged.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.opportunity,
  props: {
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      description: 'Id of the opportunity, from Create Opportunity or an opportunity trigger.',
      required: true,
    }),
    statusId: Property.ShortText({
      displayName: 'Stage ID',
      description: 'Moves the deal to this pipeline stage id, from List Pipeline Stages.',
      required: false,
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Links the deal to this client id, from Search Clients.',
      required: false,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.opportunityUpdate, audience: 'ai' }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.opportunityUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateOpportunity({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
