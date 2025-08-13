import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';

export const createBankTransfer = createAction({
  auth: xeroAuth,
  name: 'createBankTransfer',
  displayName: 'Create Bank Transfer',
  description: 'Transfers money between two bank accounts in Xero',
  props: {
    tenant_id: props.tenant_id,
    fromBankAccountID: Property.ShortText({
      displayName: 'From Bank Account ID',
      description: 'The ID of the bank account to transfer money from',
      required: true,
    }),
    toBankAccountID: Property.ShortText({
      displayName: 'To Bank Account ID',
      description: 'The ID of the bank account to transfer money to',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount to transfer between the bank accounts',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description:
        'The date of the bank transfer (YYYY-MM-DD format). Defaults to the current date if not provided.',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Optional reference for the bank transfer',
      required: false,
    }),
    fromIsReconciled: Property.Checkbox({
      displayName: 'From Is Reconciled',
      description: 'Indicates if the source account transaction is reconciled',
      required: false,
    }),
    toIsReconciled: Property.Checkbox({
      displayName: 'To Is Reconciled',
      description:
        'Indicates if the destination account transaction is reconciled',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    // Validate amount
    if (propsValue.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const bankTransferData: {
      FromBankAccount: { AccountID: string };
      ToBankAccount: { AccountID: string };
      Amount: number;
      Date?: string;
      Reference?: string;
      FromIsReconciled?: boolean;
      ToIsReconciled?: boolean;
    } = {
      FromBankAccount: {
        AccountID: propsValue.fromBankAccountID,
      },
      ToBankAccount: {
        AccountID: propsValue.toBankAccountID,
      },
      Amount: propsValue.amount,
    };

    if (propsValue.date) {
      bankTransferData.Date = propsValue.date;
    }
    if (propsValue.reference) {
      bankTransferData.Reference = propsValue.reference;
    }
    if (propsValue.fromIsReconciled !== undefined) {
      bankTransferData.FromIsReconciled = propsValue.fromIsReconciled;
    }
    if (propsValue.toIsReconciled !== undefined) {
      bankTransferData.ToIsReconciled = propsValue.toIsReconciled;
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.PUT,
      '/BankTransfers',
      { BankTransfers: [bankTransferData] },
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

    return {
      success: true,
      bankTransfer: response.BankTransfers?.[0],
      message: 'Bank transfer created successfully',
    };
  },
});
