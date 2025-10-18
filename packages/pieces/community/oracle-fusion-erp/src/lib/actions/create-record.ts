import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionAuth } from '../../auth';
import { callOracleApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createRecord = createAction({
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in the specified object path.',
  auth: oracleFusionAuth,
  props: {
    objectPath: Property.ShortText({
      displayName: 'Object Path',
      description:
        'Relative path under /fscmRestApi/resources/11.13.18.05, e.g. invoices, purchaseOrders',
      required: true,
    }),
    payload: Property.Json({
      displayName: 'Payload',
      required: true,
      defaultValue: {},
    }),
  },
  async run(ctx) {
    const { objectPath, payload } = ctx.propsValue;
    return await callOracleApi({
      auth: ctx.auth,
      method: HttpMethod.POST,
      resourcePath: `/fscmRestApi/resources/11.13.18.05/${objectPath}`,
      body: payload,
    });
  },
});
