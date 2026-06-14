import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const listPlansAction = createAction({
  name: 'list_plans',
  auth: outsetaAuth,
  displayName: 'List Plans',
  description:
    'Retrieve a paginated list of subscription plans from your Outseta billing catalog.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns a paginated list of subscription plans from the billing catalog. Use to discover available plan UIDs, e.g. before Change Account Plan or Create Account. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 100,
      description: 'Maximum number of plans to return (default 100).',
    }),
    offset: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 0,
      description:
        'Page number to fetch (0 = first page, 1 = second page, ...). Outseta uses page-based pagination, not record-based.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const limit = context.propsValue.limit ?? 100;
    const offset = context.propsValue.offset ?? 0;

    return client.get<unknown>(
      `/api/v1/billing/plans?limit=${limit}&offset=${offset}`
    );
  },
});
