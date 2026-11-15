import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { contactOutputSchema, outputKeys } from '../../common/output-schemas';
import { dynamicsProps } from '../../common/props';
import { salesEntities } from '../../common/sales-entities';

export const updateContactAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates an existing contact. Only the fields you fill in are changed.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates the filled-in fields of an existing Dynamics 365 contact. Fails instead of creating a record when the ID does not exist. Idempotent for the same values.',
    idempotent: true,
  },
  props: {
    recordId: dynamicsProps.fixedRecordDropdown({
      entitySet: 'contacts',
      displayName: 'Contact',
      description: 'The contact to update. Type to search by name, or map a contact ID.',
      required: true,
    }),
    ...salesEntities.fieldProps({ entity: salesEntities.CONTACT, mode: 'update' }),
  },
  propertyGroups: salesEntities.fieldGroups(salesEntities.CONTACT),
  outputSchema: contactOutputSchema,
  async run(context) {
    const recordId = odata.requireGuid({ value: context.propsValue.recordId, label: 'Contact' });
    const body = salesEntities.buildBody({ entity: salesEntities.CONTACT, values: context.propsValue });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const record = await makeClient(context.auth).updateRecord({ entitySet: 'contacts', recordId, fields: body });
    return odata.shapeRecord({ record, keys: outputKeys.contact });
  },
});
