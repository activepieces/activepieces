import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../common/auth';
import { accountTypeProp, partyIdProp } from '../../common/props';
import { ENDPOINTS } from '../../common/constants';

export const createAccount = createAction({
  name: 'account_create',
  displayName: 'Account - Create',
  description: 'Create a new account in Fiserv (deposit or loan)',
  auth: fiservAuth,
  props: {
    accountType: accountTypeProp,
    partyId: partyIdProp,

    // Common fields
    branchId: Property.ShortText({
      displayName: 'Branch ID',
      description: 'Branch identifier where account is opened',
      required: false,
    }),
    productCode: Property.ShortText({
      displayName: 'Product Code',
      description: 'Product code for the account type',
      required: false,
    }),

    // Deposit account fields
    openingBalance: Property.Number({
      displayName: 'Opening Balance',
      description: 'Initial deposit amount (for deposit accounts)',
      required: false,
    }),
    interestRate: Property.Number({
      displayName: 'Interest Rate',
      description: 'Interest rate percentage (for deposit accounts)',
      required: false,
    }),

    // Loan account fields
    loanAmount: Property.Number({
      displayName: 'Loan Amount',
      description: 'Principal loan amount (for loan accounts)',
      required: false,
    }),
    loanTerm: Property.Number({
      displayName: 'Loan Term (months)',
      description: 'Loan term in months (for loan accounts)',
      required: false,
    }),
    loanRate: Property.Number({
      displayName: 'Loan Interest Rate',
      description: 'Annual interest rate percentage (for loan accounts)',
      required: false,
    }),

    customFields: Property.Json({
      displayName: 'Custom Fields (JSON)',
      description: 'Additional fields to include in the request body as JSON. These will be merged with the generated request.',
      required: false,
    }),
  },

  async run(context) {
    const {
      accountType, partyId, branchId, productCode,
      openingBalance, interestRate,
      loanAmount, loanTerm, loanRate,
      customFields
    } = context.propsValue;

    const auth = context.auth as any;

    const requestBody: any = {
      AcctType: accountType,
      PartyAcctRelInfo: {
        PartyRef: {
          PartyKeys: {
            PartyId: partyId,
          },
        },
      },
    };

    // Add branch/product info
    if (branchId || productCode) {
      requestBody.AcctInfo = {};
      if (branchId) requestBody.AcctInfo.BranchId = branchId;
      if (productCode) requestBody.AcctInfo.ProductCode = productCode;
    }

    // Add deposit account info
    if (accountType !== 'LOAN' && (openingBalance || interestRate)) {
      if (!requestBody.AcctInfo) requestBody.AcctInfo = {};
      requestBody.AcctInfo.DepositAcctInfo = {};

      if (openingBalance) {
        requestBody.AcctInfo.DepositAcctInfo.OpeningBalance = openingBalance;
      }
      if (interestRate) {
        requestBody.AcctInfo.DepositAcctInfo.Rate = interestRate;
      }
    }

    // Add loan account info
    if (accountType === 'LOAN' && (loanAmount || loanTerm || loanRate)) {
      if (!requestBody.AcctInfo) requestBody.AcctInfo = {};
      requestBody.AcctInfo.LoanAcctInfo = {};

      if (loanAmount) {
        requestBody.AcctInfo.LoanAcctInfo.PrincipalAmt = loanAmount;
      }
      if (loanTerm) {
        requestBody.AcctInfo.LoanAcctInfo.TermMonths = loanTerm;
      }
      if (loanRate) {
        requestBody.AcctInfo.LoanAcctInfo.IntRate = loanRate;
      }
    }

    // Merge custom fields if provided
    if (customFields) {
      Object.assign(requestBody, customFields);
    }

    const response = await callFiservApi(
      HttpMethod.POST,
      auth,
      ENDPOINTS.ACCOUNTS_ADD,
      requestBody
    );

    return response.body;
  },
});
