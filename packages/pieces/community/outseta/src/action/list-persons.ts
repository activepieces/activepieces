import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const listPersonsAction = createAction({
  name: 'list_persons',
  auth: outsetaAuth,
  displayName: 'List Persons',
  description: 'Retrieve a paginated list of persons from your Outseta CRM.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 100,
      description: 'Maximum number of persons to return (default 100).',
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
      defaultValue: 0,
      description: 'Number of records to skip (default 0).',
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

    const result = await client.get<any>(
      `/api/v1/crm/people?limit=${limit}&offset=${offset}`
    );

    return result;
  },
});
