import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../auth';
import { FireberryClient, fireberryUtils } from '../../common/client';
import { fireberryOutputSchemas } from '../../common/output-schemas';

export const aiUpdateRecordAction = createAction({
  auth: fireberryAuth,
  name: 'ai_update_record',
  displayName: 'Update Record',
  description: 'Updates fields of an existing Fireberry record.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: fireberryOutputSchemas['updateRecord'],
  aiMetadata: {
    description: 'Updates one Fireberry record by object type and record id. fields is a JSON object of only the fields to change, keyed by field system names, e.g. {"telephone1": "+972..."}; send null to clear a field. Fields you leave out are not sent. Idempotent: repeating the same update leaves the record in the same state.',
    idempotent: true,
  },
  props: {
    objectSystemName: Property.ShortText({
      displayName: 'Object System Name',
      description: 'System name of the Fireberry object type, as returned by List Object Types (e.g. Account, Contact, Opportunity, Cases). The numeric objectType (e.g. 1 for Account, 2 for Contact) is also accepted.',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The record GUID to update.',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'JSON object of field system names to new values. Use null to clear a field.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const { systemName: objectSystemName } = await client.resolveObject(propsValue.objectSystemName);
    const recordId = propsValue.recordId.trim();
    const record = fireberryUtils.parseFieldsObject(propsValue.fields);
    if (Object.keys(record).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    await client.updateRecord({ objectSystemName: objectSystemName, recordId, record });
    const updated = await client.getRecord({ objectSystemName: objectSystemName, recordId }).catch(() => ({}));
    return { id: recordId, objectSystemName: objectSystemName, record: updated };
  },
});
