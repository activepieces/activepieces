import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkFields } from '../common/fields';
import { folkOutputSchemas } from '../output-schemas';

export const findCompany = createAction({
  auth: folkAuth,
  name: 'findCompany',
  classification: 'SEARCH',
  displayName: 'Find Company',
  description: 'Search for companies in your Folk workspace whose name contains the search text.',
  audience: 'human',
  outputSchema: folkOutputSchemas.legacyFindCompany,
  aiMetadata: {
    description:
      'Searches Folk companies whose name contains the query and returns one page of up to 100 matches, with Next Cursor for the following page. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Text the company name contains.',
      required: true,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Next Cursor from the previous result. Empty for the first page.',
      required: false,
    }),
  },
  async run(context) {
    const query = folkFields.textValue({ value: context.propsValue.query });
    if (query === undefined) {
      throw new Error('Search Query is required.');
    }
    const page = await folkClient.listPage<Record<string, unknown>>({
      auth: context.auth,
      path: '/v1/companies',
      query: { 'filter[name][like]': query },
      limit: 100,
      cursor: folkFields.cursorValue({ value: context.propsValue.cursor }),
    });
    return {
      companies: page.items,
      count: page.count,
      pagination: page.nextLink ? { nextLink: page.nextLink } : {},
      hasMore: page.hasMore, nextCursor: page.nextCursor };
  },
});
