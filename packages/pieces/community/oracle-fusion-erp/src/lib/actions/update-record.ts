import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionAuth } from '../../auth';
import { callOracleApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateRecord = createAction({
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update a record by object path and ID.',
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
    payload: Property.Json({
      displayName: 'Payload',
      required: true,
      defaultValue: {},
    }),
  },
  async run(ctx) {
    const { objectPath, id, payload } = ctx.propsValue;
    return await callOracleApi({
      auth: ctx.auth,
      method: HttpMethod.PATCH,
      resourcePath: `/fscmRestApi/resources/11.13.18.05/${objectPath}/${id}`,
      body: payload,
    });
  },
});
