import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const updateAccountAction = createAction({
  name: 'update_account',
  auth: outsetaAuth,
  displayName: 'Update Account',
  description: 'Update an existing account in Outseta',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Account Name',
      required: false,
    }),
    accountStage: Property.StaticDropdown({
      displayName: 'Account Stage',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Trialing', value: 2 },
          { label: 'Subscribing', value: 3 },
          { label: 'Canceling', value: 4 },
          { label: 'Expired', value: 5 },
          { label: 'Past Due', value: 6 },
        ],
      },
    }),
    invoiceNotes: Property.LongText({
      displayName: 'Invoice Notes',
      required: false,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body: Record<string, unknown> = {};
    if (context.propsValue.name) body['Name'] = context.propsValue.name;
    if (context.propsValue.accountStage)
      body['AccountStage'] = context.propsValue.accountStage;
    if (context.propsValue.invoiceNotes)
      body['InvoiceNotes'] = context.propsValue.invoiceNotes;

    const result = await client.put<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}`,
      body
    );

    return result;
  },
});
