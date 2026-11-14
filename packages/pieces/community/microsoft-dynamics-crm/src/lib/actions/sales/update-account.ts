import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { accountOutputSchema, outputKeys } from '../../common/output-schemas';
import { dynamicsProps } from '../../common/props';
import { salesEntities } from '../../common/sales-entities';

export const updateAccountAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'update_account',
  classification: 'WRITE',
  displayName: 'Update Account',
  description: 'Updates an existing account. Only the fields you fill in are changed.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates the filled-in fields of an existing Dynamics 365 account. Fails instead of creating a record when the ID does not exist. Idempotent for the same values.',
    idempotent: true,
  },
  props: {
    recordId: dynamicsProps.fixedRecordDropdown({
      entitySet: 'accounts',
      displayName: 'Account',
      description: 'The account to update. Type to search by name, or map a account ID.',
      required: true,
    }),
    ...salesEntities.fieldProps({ entity: salesEntities.ACCOUNT, mode: 'update' }),
  },
  outputSchema: accountOutputSchema,
  async run(context) {
    const recordId = odata.requireGuid({ value: context.propsValue.recordId, label: 'Account' });
    const body = salesEntities.buildBody({ entity: salesEntities.ACCOUNT, values: context.propsValue });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const record = await makeClient(context.auth).updateRecord({ entitySet: 'accounts', recordId, fields: body });
    return odata.shapeRecord({ record, keys: outputKeys.account });
  },
});
