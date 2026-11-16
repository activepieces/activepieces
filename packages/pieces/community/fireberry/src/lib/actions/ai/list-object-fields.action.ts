import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../auth';
import { FireberryClient } from '../../common/client';
import { fireberryFieldTypes } from '../../common/field-types';
import { fireberryOutputSchemas } from '../../common/output-schemas';

export const aiListObjectFieldsAction = createAction({
  auth: fireberryAuth,
  name: 'ai_list_object_fields',
  displayName: 'List Object Fields',
  description: 'Lists the fields of a Fireberry object type with their system names and types.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: fireberryOutputSchemas['listObjectFields'],
  aiMetadata: {
    description: 'Lists the fields of one Fireberry object type: fieldName (the key to use in create/update/search), label, and a readable type (text, number, date, datetime, picklist, lookup, email, url, phone, longtext, html, unknown). Use it before creating, updating or searching so you send real field names. For picklist fields call List Picklist Values to get the allowed values.',
    idempotent: true,
  },
  props: {
    objectSystemName: Property.ShortText({
      displayName: 'Object System Name',
      description: 'System name of the Fireberry object type, as returned by List Object Types (e.g. Account, Contact, Opportunity, Cases). The numeric objectType (e.g. 1 for Account, 2 for Contact) is also accepted.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const { systemName: objectSystemName } = await client.resolveObject(propsValue.objectSystemName);
    const metadata = await client.getObjectFieldsMetadata(objectSystemName);
    const fields = metadata.map((field) => ({
      fieldName: field.fieldName,
      label: field.label,
      type: fireberryFieldTypes.fieldTypeFromId(field.systemFieldTypeId),
      systemFieldTypeId: field.systemFieldTypeId,
    }));
    return { objectSystemName, fields, count: fields.length };
  },
});
