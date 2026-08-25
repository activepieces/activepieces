import { Property, createAction } from '@activepieces/pieces-framework';
import { salesforcesCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { querySalesforceApi } from '../common';
import { salesforceAuth } from '../..';

export const runQuery = createAction({
  auth: salesforceAuth,
  name: 'run_query',
  displayName: 'Run Query (Advanced)',
  description: 'Run a salesforce query',
  audience: 'both',
  aiMetadata: { description: 'Run an arbitrary SOQL query string and return the matching records (read-only). Use this for any read needing multiple conditions, field selection, relationships, ordering, or aggregation that the simpler Find Record lookup cannot express; the caller must supply valid SOQL.', idempotent: true },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Enter the query',
      required: true,
    }),
  },
  async run(context) {
    const { query } = context.propsValue;
    const response = await await querySalesforceApi<{
      records: { CreatedDate: string }[];
    }>(HttpMethod.GET, context.auth, query);
    return response;
  },
});
