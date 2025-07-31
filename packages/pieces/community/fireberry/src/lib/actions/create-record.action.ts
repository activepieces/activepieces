import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown, objectFields } from '../common/props';
import { FireberryClient } from '../common/client';

export const createRecordAction = createAction({
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in Fireberry.',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    fields: objectFields,
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, fields } = propsValue;

    const fieldsObj = typeof fields === 'string' ? JSON.parse(fields) : fields;
    
    if (typeof fieldsObj !== 'object' || fieldsObj === null) {
      throw new Error('Fields must be an object');
    }

    return await client.batchCreate(objectType, [fieldsObj]);
  },
}); 