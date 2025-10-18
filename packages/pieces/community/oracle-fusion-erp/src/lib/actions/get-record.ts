import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionAuth } from '../../auth';
import { callOracleApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getRecord = createAction({
  name: 'get_record',
  displayName: 'Get Record',
  description: 'Get a record by object path and ID.',
  auth: oracleFusionAuth,
  props: {
    objectPath: Property.ShortText({ displayName: 'Object Path', required: true }),
    id: Property.ShortText({ displayName: 'Record ID', required: true }),
    fields: Property.ShortText({
      displayName: 'Fields (optional)',
      required: false,
      description: 'Comma-separated fields to return (depends on object)',
    }),
  },
  async run(ctx) {
    const { objectPath, id, fields } = ctx.propsValue;
    return await callOracleApi({
      auth: ctx.auth,
      method: HttpMethod.GET,
      resourcePath: `/fscmRestApi/resources/11.13.18.05/${objectPath}/${id}`,
      query: fields ? { fields } : undefined,
    });
  },
});
