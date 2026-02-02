import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { createOAuthHeader } from '../oauth';
import { format as formatSQL, ParamItems } from 'sql-formatter';

const PAGE_SIZE = 1000;

const mkdown = `
- **DO NOT** insert dynamic input directly into the query string. Instead, use :1, :2, :3 and add them in args for parameterized queries
- Arguments are treated as string and inserted as a [Text Literal](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Literals.html)
`;

export const runSuiteQL = createAction({
  name: 'runSuiteQL',
  auth: netsuiteAuth,
  displayName: 'Run SuiteQL Query',
  description: 'Run SuiteQL Query on NetSuite.',
  props: {
    markdown: Property.MarkDown({
      value: mkdown,
    }),

    query: Property.ShortText({
      displayName: 'Query',
      description: 'Please use :1, :2, :3 etc. for parameterized queries',
      required: true,
    }),

    args: Property.Array({
      displayName: 'Arguments',
      description: 'Arguments to be used in the query',
      required: false,
    }),
  },
  async run(context) {
    const { accountId, consumerKey, consumerSecret, tokenId, tokenSecret } =
      context.auth.props;

    const query = context.propsValue.query;
    const args: string[] = (context.propsValue.args as string[]) || [];

    // numbered placeholders: https://github.com/sql-formatter-org/sql-formatter/blob/master/docs/params.md#numbered-placeholders
    const formattedArgs = args.reduce((acc, arg, idx) => {
      // numbered placeholders are 1 indexed
      const argNum = idx + 1;
      // use q notation to escape quotes
      acc[argNum] = `q'{${arg}}'`;
      return acc;
    }, {} as ParamItems);

    // netsuite uses oracle sql: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156257790831.html
    const formattedSQL = formatSQL(query, {
      language: 'plsql',
      params: formattedArgs,
    });

    const results = [];
    let pageOffset = 0;
    let hasMore = true;

    const requestUrl = `https://${accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`;
    const httpMethod = HttpMethod.POST;

    // paginate results: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156414087576.html
    while (hasMore) {
      const queryParams = {
        limit: String(PAGE_SIZE),
        offset: String(pageOffset),
      };

      const authHeader = createOAuthHeader(
        accountId,
        consumerKey,
        consumerSecret,
        tokenId,
        tokenSecret,
        requestUrl,
        httpMethod,
        queryParams
      );

      const response = await httpClient.sendRequest({
        method: httpMethod,
        url: requestUrl,
        headers: {
          Authorization: authHeader,
          prefer: 'transient',
          Cookie: 'NS_ROUTING_VERSION=LAGGING',
        },
        body: {
          q: formattedSQL,
        },
        queryParams: queryParams,
      });

      results.push(...(response.body?.items || []));

      hasMore = response.body?.hasMore || false;
      pageOffset += PAGE_SIZE;
    }

    return results;
  },
});
