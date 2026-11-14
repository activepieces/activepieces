import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { leadOutputSchema, outputKeys } from '../../common/output-schemas';
import { dynamicsProps } from '../../common/props';
import { salesEntities } from '../../common/sales-entities';

export const updateLeadAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'update_lead',
  classification: 'WRITE',
  displayName: 'Update Lead',
  description: 'Updates an existing lead. Only the fields you fill in are changed.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates the filled-in fields of an existing Dynamics 365 lead. Fails instead of creating a record when the ID does not exist. Idempotent for the same values.',
    idempotent: true,
  },
  props: {
    recordId: dynamicsProps.fixedRecordDropdown({
      entitySet: 'leads',
      displayName: 'Lead',
      description: 'The lead to update. Type to search by name, or map a lead ID.',
      required: true,
    }),
    ...salesEntities.fieldProps({ entity: salesEntities.LEAD, mode: 'update' }),
  },
  propertyGroups: salesEntities.fieldGroups(salesEntities.LEAD),
  outputSchema: leadOutputSchema,
  async run(context) {
    const recordId = odata.requireGuid({ value: context.propsValue.recordId, label: 'Lead' });
    const body = salesEntities.buildBody({ entity: salesEntities.LEAD, values: context.propsValue });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const record = await makeClient(context.auth).updateRecord({ entitySet: 'leads', recordId, fields: body });
    return odata.shapeRecord({ record, keys: outputKeys.lead });
  },
});
