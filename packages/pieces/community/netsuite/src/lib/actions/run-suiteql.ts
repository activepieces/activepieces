import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';
import { format as formatSQL, ParamItems } from 'sql-formatter';

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
    const client = new NetSuiteClient(context.auth.props);

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

    return client.makePaginatedRequest({
      method: HttpMethod.POST,
      url: `${client.baseUrl}/services/rest/query/v1/suiteql`,
      body: {
        q: formattedSQL,
      },
    });
  },
});
