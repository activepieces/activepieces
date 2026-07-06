import { createAction, Property } from '@activepieces/pieces-framework';
import { roeAiAuth } from '../common/auth';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const runQuery = createAction({
  auth: roeAiAuth,
  name: 'runQuery',
  displayName: 'Run Query',
  description: 'Execute a query synchronously and return results',
  audience: 'both',
  aiMetadata: {
    description:
      'Executes an arbitrary SQL query against the Roe AI database synchronously and returns the results, optionally scoped to a worksheet ID or run with admin privileges. Use to read or manipulate data directly via SQL. Because the query can mutate data and each run executes independently, treat this as not idempotent.',
    idempotent: false,
  },
  props: {
    query: Property.LongText({
      displayName: 'SQL Query',
      description: 'SQL query to execute',
      required: true,
    }),
    worksheet_id: Property.ShortText({
      displayName: 'Worksheet ID',
      description: 'Optional worksheet ID',
      required: false,
    }),
    use_admin: Property.Checkbox({
      displayName: 'Use Admin Privileges',
      description: 'Use admin privileges for the query',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { query, worksheet_id, use_admin } = context.propsValue;
    const { apiKey, organization_id } = context.auth.props;

    const payload: any = {
      query,
      organization_id,
    };
    if (worksheet_id) {
      payload.worksheet_id = worksheet_id;
    }
    if (use_admin) {
      payload.use_admin = use_admin;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.roe-ai.com/v1/database/query',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: payload,
    });

    return response.body;
  },
});
