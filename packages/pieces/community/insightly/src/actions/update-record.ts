import { createAction, Property } from '@activepieces/pieces-framework';
import { makeInsightlyRequest , insightlyAuth, INSIGHTLY_OBJECTS } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const updateRecordAction = createAction({
  auth: insightlyAuth,
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update an existing record\'s fields',
  props: {
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to update',
      required: true,
      options: {
        options: INSIGHTLY_OBJECTS.map(obj => ({
          label: obj,
          value: obj,
        })),
      },
    }),
    recordData: Property.Json({
      displayName: 'Record Data',
      description: 'JSON object containing the record fields including the ID field (e.g., {"CONTACT_ID": 123, "FIRST_NAME": "Jane"})',
      required: true,
    }),
  },
  async run(context) {
    const objectType = context.propsValue.objectType;
    const recordData = context.propsValue.recordData;

    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}`,
      HttpMethod.PUT,
      recordData
    );

    return response.body;
  },
});