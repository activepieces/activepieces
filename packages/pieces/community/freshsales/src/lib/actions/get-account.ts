import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { accountOutputSchema } from '../output-schemas';

export const getAccount = createAction({
  auth: freshsalesAuth,
  name: 'get_account',
  displayName: 'Get Account',
  description: 'Get an account by its ID',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Freshsales account (sales account) by numeric ID. Fails with a not-found error if the ID does not exist. Use Find Account by Name when you only know the name.',
    idempotent: true,
  },
  outputSchema: accountOutputSchema,
  props: {
    sales_account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'ID of the account to fetch',
      placeholder: '16000123456',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({ value: context.propsValue.sales_account_id, field: 'Account ID' });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/sales_accounts/${id}`,
      query: { include: freshsalesRecords.RECORD_INCLUDES.sales_accounts },
    });
    return freshsalesClient.unwrap({ body: response, key: 'sales_account' });
  },
});
