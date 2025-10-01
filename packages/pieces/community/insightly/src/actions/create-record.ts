import { createAction, Property } from '@activepieces/pieces-framework';
import { makeInsightlyRequest , insightlyAuth, INSIGHTLY_OBJECTS } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const createRecordAction = createAction({
  auth: insightlyAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in a specified Insightly object',
  props: {
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to create',
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
      description: 'JSON object containing the record fields (e.g., {"FIRST_NAME": "John", "LAST_NAME": "Doe"})',
      required: true,
    }),
  },
  async run(context) {
    const objectType = context.propsValue.objectType;
    const recordData = context.propsValue.recordData;

    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}`,
      HttpMethod.POST,
      recordData
    );

    return response.body;
  },
});