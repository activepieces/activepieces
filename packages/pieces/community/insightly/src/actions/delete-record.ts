import { createAction, Property } from '@activepieces/pieces-framework';
import { makeInsightlyRequest , insightlyAuth, INSIGHTLY_OBJECTS } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const deleteRecordAction = createAction({
  auth: insightlyAuth,
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Deletes a record',
  props: {
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to delete',
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
      description: 'The ID of the record to delete',
      required: true,
    }),
  },
  async run(context) {
    const objectType = context.propsValue.objectType;
    const recordId = context.propsValue.recordId;

    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}/${recordId}`,
      HttpMethod.DELETE
    );

    return {
      success: true,
      objectType,
      recordId,
      deletedAt: new Date().toISOString(),
    };
  },
});