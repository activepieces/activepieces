import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { accountOutputSchema, outputKeys } from '../../common/output-schemas';
import { salesEntities } from '../../common/sales-entities';

export const createAccountAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'create_account',
  classification: 'WRITE',
  displayName: 'Create Account',
  description: 'Creates a new account (a company or organization).',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a Dynamics 365 account from common fields. Each call creates a new account, so retries create duplicates.',
    idempotent: false,
  },
  props: salesEntities.fieldProps({ entity: salesEntities.ACCOUNT, mode: 'create' }),
  propertyGroups: salesEntities.fieldGroups(salesEntities.ACCOUNT),
  outputSchema: accountOutputSchema,
  async run(context) {
    const body = salesEntities.buildBody({ entity: salesEntities.ACCOUNT, values: context.propsValue });
    const record = await makeClient(context.auth).createRecord({ entitySet: 'accounts', fields: body });
    return odata.shapeRecord({ record, keys: outputKeys.account });
  },
});
