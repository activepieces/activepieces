import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bolnaaiAuth } from '../common/auth';
import { bolnaClient } from '../common/client';
import { bolnaSchemas } from '../common/schemas';

export const getAccountInfo = createAction({
  auth: bolnaaiAuth,
  name: 'get_account_info',
  displayName: 'Get Account Info',
  description: 'Get the Bolna account profile, wallet balance and concurrency.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: {
    fields: [
      { key: 'id', label: 'Account ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'wallet', label: 'Wallet Balance', format: 'number' },
      { key: 'credit_limit', label: 'Credit Limit', format: 'number' },
      {
        key: 'concurrency',
        label: 'Concurrency',
        children: [
          { key: 'max', label: 'Max Concurrent Calls', format: 'number' },
          {
            key: 'current',
            label: 'Current Concurrent Calls',
            format: 'number',
          },
        ],
      },
    ],
  },
  aiMetadata: {
    description:
      'Returns the Bolna account name, email, wallet balance, credit limit and concurrent-call usage (max and current). Check the wallet balance and free concurrency before placing calls with Make Phone Call. The currency is not returned by the API.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await bolnaClient.makeRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/user/me',
    });
    const record = bolnaSchemas.isRecord(response) ? response : {};
    const concurrency = bolnaSchemas.isRecord(record['concurrency'])
      ? record['concurrency']
      : {};
    return {
      ...bolnaSchemas.pick({
        source: record,
        keys: ['id', 'name', 'email', 'wallet', 'credit_limit'],
      }),
      concurrency: bolnaSchemas.pick({
        source: concurrency,
        keys: ['max', 'current'],
      }),
    };
  },
});
