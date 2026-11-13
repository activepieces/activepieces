import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieFields } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieUpdateOpportunityAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_update_opportunity',
  classification: 'WRITE',
  displayName: 'Update Opportunity',
  description: 'Move a deal to another pipeline stage or update its details. Empty fields keep their current value.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates a Moxie opportunity by id with stage and client picked from lists; only filled fields change. For agents use moxie_opportunity_update. Idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.opportunity,
  props: {
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      description: 'Map the id from an opportunity trigger or the Create Opportunity step.',
      required: true,
    }),
    statusId: moxieDropdowns.pipelineStage({
      required: false,
      valueKey: 'id',
      displayName: 'Move to Stage',
      description: 'Leave empty to keep the current stage.',
    }),
    clientId: moxieDropdowns.clientId({ required: false, description: 'Links the deal to this client. Leave empty to keep the current client.' }),
    ...moxieProps.fromSpecs({ specs: moxieFields.opportunityUpdate, audience: 'human' }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.opportunityUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateOpportunity({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
