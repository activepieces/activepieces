import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../auth';
import { objectTypeDropdown, updateFields, fireberryProps } from '../common/props';
import { FireberryClient, fireberryUtils } from '../common/client';
import { fireberryOutputSchemas } from '../common/output-schemas';

const recordDropdown = Property.Dropdown({
  auth: fireberryAuth,
  displayName: 'Record',
  required: true,
  refreshers: ['objectType'],
  options: async ({ auth, objectType }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Fireberry account' };
    }
    return fireberryProps.recordOptions({ token: auth.secret_text, objectType, top: 50 });
  },
});

export const updateRecordAction = createAction({
  name: 'update_record',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Update an existing record in Fireberry. Empty fields keep their current value.',
  audience: 'human',
  auth: fireberryAuth,
  outputSchema: fireberryOutputSchemas['updateRecord'],
  props: {
    objectType: objectTypeDropdown,
    recordId: recordDropdown,
    fields: updateFields,
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const { objectType, recordId } = propsValue;
    if (!recordId) {
      throw new Error('Record ID is required');
    }
    const fieldsObj = fireberryUtils.parseFieldsObject(propsValue.fields);
    const record = Object.fromEntries(
      Object.entries(fieldsObj).filter(([, value]) => value !== '' && value !== null && value !== undefined),
    );
    if (Object.keys(record).length === 0) {
      throw new Error('Fill in at least one field to update.');
    }
    await client.updateRecord({ objectSystemName: objectType, recordId, record });
    const updated = await client.getRecord({ objectSystemName: objectType, recordId }).catch(() => ({}));
    return { id: recordId, objectSystemName: objectType, record: updated };
  },
});
