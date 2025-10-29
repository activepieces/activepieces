import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionAuth } from '../../auth';
import { callOracleApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchRecords = createAction({
  name: 'search_records',
  displayName: 'Search Records',
  description: 'Search records in an object using a query filter.',
  auth: oracleFusionAuth,
  props: {
    objectPath: Property.ShortText({ displayName: 'Object Path', required: true }),
    q: Property.ShortText({
      displayName: 'Query',
      description: 'Filter expression supported by the selected object (e.g., InvoiceNumber="123")',
      required: false,
    }),
    limit: Property.Number({ displayName: 'Limit', required: false, defaultValue: 25 }),
    offset: Property.Number({ displayName: 'Offset', required: false, defaultValue: 0 }),
  },
  async run(ctx) {
    const { objectPath, q, limit, offset } = ctx.propsValue;
    return await callOracleApi({
      auth: ctx.auth,
      method: HttpMethod.GET,
      resourcePath: `/fscmRestApi/resources/11.13.18.05/${objectPath}`,
      query: {
        ...(q ? { q } : {}),
        limit: limit ?? 25,
        offset: offset ?? 0,
      },
    });
  },
});
