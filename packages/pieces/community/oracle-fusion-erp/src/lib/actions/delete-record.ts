import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionAuth } from '../../auth';
import { callOracleApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteRecord = createAction({
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Delete a record by object path and ID.',
  auth: oracleFusionAuth,
  props: {
    objectPath: Property.ShortText({
      displayName: 'Object Path',
      required: true,
    }),
    id: Property.ShortText({
      displayName: 'Record ID',
      required: true,
    }),
  },
  async run(ctx) {
    const { objectPath, id } = ctx.propsValue;
    return await callOracleApi({
      auth: ctx.auth,
      method: HttpMethod.DELETE,
      resourcePath: `/fscmRestApi/resources/11.13.18.05/${objectPath}/${id}`,
    });
  },
});
