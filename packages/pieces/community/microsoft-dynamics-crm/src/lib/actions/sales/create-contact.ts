import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { contactOutputSchema, outputKeys } from '../../common/output-schemas';
import { salesEntities } from '../../common/sales-entities';

export const createContactAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Creates a new contact (a person you do business with).',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a Dynamics 365 contact from common fields. Each call creates a new contact, so retries create duplicates.',
    idempotent: false,
  },
  props: salesEntities.fieldProps({ entity: salesEntities.CONTACT, mode: 'create' }),
  outputSchema: contactOutputSchema,
  async run(context) {
    const body = salesEntities.buildBody({ entity: salesEntities.CONTACT, values: context.propsValue });
    const record = await makeClient(context.auth).createRecord({ entitySet: 'contacts', fields: body });
    return odata.shapeRecord({ record, keys: outputKeys.contact });
  },
});
