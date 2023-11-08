import {
  createAction,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { ynabAuth } from '../../index';
import { ynabCommon } from '../common';
import { YnabTransaction } from '../common/models';

export const createTransaction = createAction({
  name: 'create_transaction',
  auth: ynabAuth,
  displayName: 'Create Transaction',
  description: 'Creates a new transaction',
  props: {
    budget: ynabCommon.budget,
    account: ynabCommon.account,
    date: Property.DateTime({
      displayName: 'Date',
      required: true,
      description: 'The date of the transaction in ISO format',
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
      description: 'The amount of the transaction',
    }),
    payeeName: Property.ShortText({
      displayName: 'Payee Name',
      required: false,
      description: 'The name of the payee for the transaction',
    }),
    categoryId: Property.ShortText({
      displayName: 'Category ID',
      required: false,
      description: 'The ID of the category for the transaction',
    }),
    memo: Property.ShortText({
      displayName: 'Memo',
      required: false,
      description: 'The memo for the transaction',
    }),
    cleared: Property.StaticDropdown({
      displayName: 'Cleared',
      required: false,
      description: 'The cleared status of the transaction',
      options: {
        options: [
          { value: 'cleared', label: 'Cleared' },
          { value: 'uncleared', label: 'Uncleared' },
          { value: 'reconciled', label: 'Reconciled' },
        ],
      },
    }),
    approved: Property.Checkbox({
      displayName: 'Approved',
      required: true,
      defaultValue: false,
      description: 'Whether or not the transaction is approved.',
    }),
    flagColor: Property.StaticDropdown({
      displayName: 'Flag Color',
      required: false,
      description: 'The transaction flag',
      defaultValue: '',
      options: {
        options: [
          { value: '', label: '' },
          { value: 'red', label: 'Red' },
          { value: 'orange', label: 'Orange' },
          { value: 'yellow', label: 'Yellow' },
          { value: 'green', label: 'Green' },
          { value: 'blue', label: 'Blue' },
          { value: 'purple', label: 'Purple' },
        ],
      },
    }),
    importId: Property.ShortText({
      displayName: 'Import ID',
      required: false,
      description: 'The transaction import ID',
      validators: [Validators.maxLength(36)],
    }),
  },
  async run(context) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${ynabCommon.apiUrl}/budgets/${context.propsValue.budget}/transactions`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      body: {
        transaction: {
          account_id: context.propsValue.account,
          date: context.propsValue.date,
          amount: ynabCommon.toMilliUnits(context.propsValue.amount),
          approved: context.propsValue.approved,
          payee_name: context.propsValue.payeeName,
        },
      },
    };

    const response = await httpClient.sendRequest<{
      data: { transaction_ids: string[]; transaction: YnabTransaction };
    }>(request);

    if (response.status === 201) {
      return response.body;
    }

    return response;
  },
});
