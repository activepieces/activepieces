import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../auth';
import { FireberryClient } from '../../common/client';
import { fireberryOutputSchemas } from '../../common/output-schemas';

export const aiGetRecordAction = createAction({
  auth: fireberryAuth,
  name: 'ai_get_record',
  displayName: 'Get Record',
  description: 'Gets one Fireberry record by its ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: fireberryOutputSchemas['getRecord'],
  aiMetadata: {
    description: 'Fetches a single Fireberry record with all its fields by object type and record ID (a GUID). Use it when you already know the id, e.g. from Search Records or Create Record. Fails with the Fireberry error text if the id does not exist.',
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
      description: 'The record GUID.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const { systemName: objectSystemName } = await client.resolveObject(propsValue.objectSystemName);
    const recordId = propsValue.recordId.trim();
    const record = await client.getRecord({ objectSystemName, recordId });
    return { id: recordId, objectSystemName, record };
  },
});
