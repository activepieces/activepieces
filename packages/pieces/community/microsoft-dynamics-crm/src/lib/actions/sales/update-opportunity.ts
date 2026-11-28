import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { opportunityOutputSchema, outputKeys } from '../../common/output-schemas';
import { dynamicsProps } from '../../common/props';
import { salesEntities } from '../../common/sales-entities';

export const updateOpportunityAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'update_opportunity',
  classification: 'WRITE',
  displayName: 'Update Opportunity',
  description: 'Updates an existing opportunity. Only the fields you fill in are changed.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates the filled-in fields of an existing Dynamics 365 opportunity. Fails instead of creating a record when the ID does not exist. Idempotent for the same values.',
    idempotent: true,
  },
  props: {
    recordId: dynamicsProps.fixedRecordDropdown({
      entitySet: 'opportunities',
      displayName: 'Opportunity',
      description: 'The opportunity to update. Type to search by name, or map a opportunity ID.',
      required: true,
    }),
    ...salesEntities.fieldProps({ entity: salesEntities.OPPORTUNITY, mode: 'update' }),
  },
  outputSchema: opportunityOutputSchema,
  async run(context) {
    const recordId = odata.requireGuid({ value: context.propsValue.recordId, label: 'Opportunity' });
    const body = salesEntities.buildBody({ entity: salesEntities.OPPORTUNITY, values: context.propsValue });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const record = await makeClient(context.auth).updateRecord({ entitySet: 'opportunities', recordId, fields: body });
    return odata.shapeRecord({ record, keys: outputKeys.opportunity });
  },
});
