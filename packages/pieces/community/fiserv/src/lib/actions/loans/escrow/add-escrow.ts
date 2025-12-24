import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../../common/auth';
import { ENDPOINTS } from '../../../common/constants';

export const addEscrow = createAction({
  name: 'escrow_add',
  displayName: 'Escrow - Add',
  description: 'Add escrow account to a loan in Fiserv',
  auth: fiservAuth,
  props: {
    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the loan to add escrow to',
      required: true,
    }),

    escrowType: Property.StaticDropdown({
      displayName: 'Escrow Type',
      description: 'Type of escrow account',
      required: true,
      options: {
        options: [
          { label: 'Property Tax', value: 'PropertyTax' },
          { label: 'Insurance', value: 'Insurance' },
          { label: 'HOA Fees', value: 'HOAFees' },
          { label: 'Flood Insurance', value: 'FloodInsurance' },
          { label: 'PMI', value: 'PMI' },
          { label: 'Other', value: 'Other' },
        ],
      },
    }),

    monthlyPayment: Property.Number({
      displayName: 'Monthly Payment',
      description: 'Monthly escrow payment amount',
      required: true,
    }),

    currentBalance: Property.Number({
      displayName: 'Current Balance',
      description: 'Current escrow account balance',
      required: false,
      defaultValue: 0,
    }),

    targetBalance: Property.Number({
      displayName: 'Target Balance',
      description: 'Target escrow balance to maintain',
      required: false,
    }),

    payee: Property.ShortText({
      displayName: 'Payee',
      description: 'Name of the entity receiving escrow payments',
      required: false,
    }),

    accountNumber: Property.ShortText({
      displayName: 'Account Number',
      description: 'Escrow account number or reference',
      required: false,
    }),
  },

  async run(context) {
    const {
      loanId,
      escrowType,
      monthlyPayment,
      currentBalance,
      targetBalance,
      payee,
      accountNumber,
    } = context.propsValue;

    const auth = context.auth as any;

    const requestBody: any = {
      LoanKeys: {
        LoanId: loanId,
      },
      EscrowInfo: {
        EscrowType: escrowType,
        MonthlyPayment: monthlyPayment,
        CurrentBalance: currentBalance || 0,
      },
    };

    // Add optional fields
    if (targetBalance !== undefined && targetBalance !== null) {
      requestBody.EscrowInfo.TargetBalance = targetBalance;
    }
    if (payee) {
      requestBody.EscrowInfo.Payee = payee;
    }
    if (accountNumber) {
      requestBody.EscrowInfo.AccountNumber = accountNumber;
    }

    const response = await callFiservApi(
      HttpMethod.POST,
      auth,
      ENDPOINTS.ESCROW_ADD,
      requestBody
    );

    return response.body;
  },
});
