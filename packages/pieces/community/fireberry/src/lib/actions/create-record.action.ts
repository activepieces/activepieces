import { createAction } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../auth';
import { objectTypeDropdown, objectFields } from '../common/props';
import { FireberryClient, fireberryUtils } from '../common/client';
import { fireberryOutputSchemas } from '../common/output-schemas';

export const createRecordAction = createAction({
  name: 'create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Create a new record in Fireberry.',
  audience: 'human',
  auth: fireberryAuth,
  outputSchema: fireberryOutputSchemas['createRecord'],
  props: {
    objectType: objectTypeDropdown,
    fields: objectFields,
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const objectSystemName = propsValue.objectType;
    const fieldsObj = fireberryUtils.parseFieldsObject(propsValue.fields);
    const record = Object.fromEntries(
      Object.entries(fieldsObj).filter(([, value]) => value !== '' && value !== null && value !== undefined),
    );
    const body = await client.createRecord({ objectSystemName, record });
    return fireberryUtils.toRecordResult({ body, objectSystemName });
  },
});
