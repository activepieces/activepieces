import { createAction, Property } from '@activepieces/pieces-framework';
import { makeInsightlyRequest , insightlyAuth, INSIGHTLY_OBJECTS } from '../common/common';


export const getRecordAction = createAction({
  auth: insightlyAuth,
  name: 'get_record',
  displayName: 'Get Record',
  description: 'Gets a record by ID',
  props: {
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to retrieve',
      required: true,
      options: {
        options: INSIGHTLY_OBJECTS.map(obj => ({
          label: obj,
          value: obj,
        })),
      },
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const objectType = context.propsValue.objectType;
    const recordId = context.propsValue.recordId;

    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}/${recordId}`
    );

    return response.body;
  },
});