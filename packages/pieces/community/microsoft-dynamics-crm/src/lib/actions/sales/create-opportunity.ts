import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { opportunityOutputSchema, outputKeys } from '../../common/output-schemas';
import { salesEntities } from '../../common/sales-entities';

export const createOpportunityAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'create_opportunity',
  classification: 'WRITE',
  displayName: 'Create Opportunity',
  description: 'Creates a new opportunity (a potential sale linked to an account or contact).',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a Dynamics 365 opportunity from common fields. Each call creates a new opportunity, so retries create duplicates.',
    idempotent: false,
  },
  props: salesEntities.fieldProps({ entity: salesEntities.OPPORTUNITY, mode: 'create' }),
  outputSchema: opportunityOutputSchema,
  async run(context) {
    const body = salesEntities.buildBody({ entity: salesEntities.OPPORTUNITY, values: context.propsValue });
    const record = await makeClient(context.auth).createRecord({ entitySet: 'opportunities', fields: body });
    return odata.shapeRecord({ record, keys: outputKeys.opportunity });
  },
});
