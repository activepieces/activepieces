import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../auth';
import { FireberryClient, fireberryUtils } from '../../common/client';
import { fireberryOutputSchemas } from '../../common/output-schemas';

export const aiCreateRecordAction = createAction({
  auth: fireberryAuth,
  name: 'ai_create_record',
  displayName: 'Create Record',
  description: 'Creates a Fireberry record from a JSON object of field values.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: fireberryOutputSchemas['createRecord'],
  aiMetadata: {
    description: 'Creates one record of a Fireberry object type. fields is a JSON object keyed by field system names from List Object Fields, e.g. {"accountname": "Acme", "emailaddress1": "info@acme.com"}. Picklist fields take the value from List Picklist Values; lookup fields take the related record id. Returns the new record id and the created record. Not idempotent: every call inserts another record, so search first if a duplicate would be a problem.',
    idempotent: false,
  },
  props: {
    objectSystemName: Property.ShortText({
      displayName: 'Object System Name',
      description: 'System name of the Fireberry object type, as returned by List Object Types (e.g. Account, Contact, Opportunity, Cases). The numeric objectType (e.g. 1 for Account, 2 for Contact) is also accepted.',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'JSON object of field system names to values.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const { systemName: objectSystemName } = await client.resolveObject(propsValue.objectSystemName);
    const record = fireberryUtils.parseFieldsObject(propsValue.fields);
    if (Object.keys(record).length === 0) {
      throw new Error('Provide at least one field to create the record with.');
    }
    const body = await client.createRecord({ objectSystemName, record });
    return fireberryUtils.toRecordResult({ body, objectSystemName });
  },
});
