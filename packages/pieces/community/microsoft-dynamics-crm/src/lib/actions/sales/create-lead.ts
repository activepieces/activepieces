import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { leadOutputSchema, outputKeys } from '../../common/output-schemas';
import { salesEntities } from '../../common/sales-entities';

export const createLeadAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'create_lead',
  classification: 'WRITE',
  displayName: 'Create Lead',
  description: 'Creates a new lead (a potential customer that is not yet qualified).',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a Dynamics 365 lead from common fields. Each call creates a new lead, so retries create duplicates.',
    idempotent: false,
  },
  props: salesEntities.fieldProps({ entity: salesEntities.LEAD, mode: 'create' }),
  outputSchema: leadOutputSchema,
  async run(context) {
    const body = salesEntities.buildBody({ entity: salesEntities.LEAD, values: context.propsValue });
    const record = await makeClient(context.auth).createRecord({ entitySet: 'leads', fields: body });
    return odata.shapeRecord({ record, keys: outputKeys.lead });
  },
});
