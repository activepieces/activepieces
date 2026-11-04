import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../auth';
import { pocketbaseClient } from '../common/client';
import { pocketbaseProps } from '../common/props';
import { pocketbaseGetFullListOutputSchema } from '../output-schemas';

export const getFullListAction = createAction({
  name: 'getFullList',
  outputSchema: pocketbaseGetFullListOutputSchema,
  classification: 'SEARCH',
  displayName: 'Get Full List',
  description: 'Gets all the data for a given collection',
  audience: 'both',
  aiMetadata: { description: 'Fetches every record in a PocketBase collection, auto-paginating through all pages so the full set is returned in one call. Optionally narrow with a filter expression, sort, or field selection; with no filter it returns the entire collection. Use when you need the complete dataset rather than a single page; for large collections prefer Get List to page through results. Read-only and idempotent.', idempotent: true },
  auth: pocketbaseAuth,
  props: {
    collection: pocketbaseProps.collection({ required: true }),
    sort: pocketbaseProps.sort({ required: false }),
    filter: pocketbaseProps.filter({ required: false }),
    expand: pocketbaseProps.expand({ required: false }),
    fields: pocketbaseProps.fields({ required: false }),
  },
  async run(context) {
    const { collection, sort, filter, expand, fields } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (sort) queryParams['sort'] = sort;
    if (filter) queryParams['filter'] = filter;
    if (expand) queryParams['expand'] = expand;
    if (fields) queryParams['fields'] = fields;

    return await pocketbaseClient.paginate<unknown>({
      auth: context.auth,
      path: `/api/collections/${encodeURIComponent(collection)}/records`,
      query: queryParams,
    });
  },
});
