import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../auth';
import { FireberryClient } from '../../common/client';
import { fireberryOutputSchemas } from '../../common/output-schemas';

export const aiListPicklistValuesAction = createAction({
  auth: fireberryAuth,
  name: 'ai_list_picklist_values',
  displayName: 'List Picklist Values',
  description: 'Lists the allowed values of a Fireberry picklist field.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: fireberryOutputSchemas['listPicklistValues'],
  aiMetadata: {
    description: 'Lists the allowed options of one picklist field: name (what users see) and value (what you must send when creating, updating or querying). Use it whenever List Object Fields reports type picklist.',
    idempotent: true,
  },
  props: {
    objectSystemName: Property.ShortText({
      displayName: 'Object System Name',
      description: 'System name of the Fireberry object type, as returned by List Object Types (e.g. Account, Contact, Opportunity, Cases). The numeric objectType (e.g. 1 for Account, 2 for Contact) is also accepted.',
      required: true,
    }),
    fieldName: Property.ShortText({
      displayName: 'Field Name',
      description: 'System name of the picklist field, as returned by List Object Fields (e.g. statuscode).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const { systemName: objectSystemName } = await client.resolveObject(propsValue.objectSystemName);
    const fieldName = propsValue.fieldName.trim();
    const picklist = await client.getPicklistValues({ objectSystemName, fieldName });
    const values = picklist.map((option) => ({ name: option.name, value: option.value }));
    return { objectSystemName, fieldName, values, count: values.length };
  },
});
