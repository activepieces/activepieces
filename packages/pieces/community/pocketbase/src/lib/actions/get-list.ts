import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../auth';
import { pocketbaseClient } from '../common/client';
import { pocketbaseProps } from '../common/props';
import { pocketbaseGetListOutputSchema } from '../output-schemas';

export const getListAction = createAction({
  name: 'getList',
  outputSchema: pocketbaseGetListOutputSchema,
  classification: 'SEARCH',
  displayName: 'Get List',
  description: 'Gets a paginated list of records from a collection',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single page of records from a PocketBase collection, controlled by page and per-page size, with optional filter expression, sort, and field selection. Use when you want bounded results or to iterate page by page; for the entire collection in one call use Get Full List instead. Read-only and idempotent.', idempotent: true },
  auth: pocketbaseAuth,
  props: {
    collection: pocketbaseProps.collection({ required: true }),
    page: Property.Number({
      displayName: 'Page',
      description: 'The page (offset) of the paginated list (default: 1)',
      required: false,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Max returned records per page (default: 30)',
      required: false,
    }),
    sort: pocketbaseProps.sort({ required: false }),
    filter: pocketbaseProps.filter({ required: false }),
    expand: pocketbaseProps.expand({ required: false }),
    fields: pocketbaseProps.fields({ required: false }),
    skipTotal: Property.Checkbox({
      displayName: 'Skip Total',
      description: 'Skip total counts query for faster results (totalItems and totalPages will be -1)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { collection, page, perPage, sort, filter, expand, fields, skipTotal } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (page) queryParams['page'] = String(page);
    if (perPage) queryParams['perPage'] = String(perPage);
    if (sort) queryParams['sort'] = sort;
    if (filter) queryParams['filter'] = filter;
    if (expand) queryParams['expand'] = expand;
    if (fields) queryParams['fields'] = fields;
    if (skipTotal) queryParams['skipTotal'] = 'true';

    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/collections/${encodeURIComponent(collection)}/records`,
      query: queryParams,
    });
  },
});
