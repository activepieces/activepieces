import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { trueLayerCommon } from './lib/common';

import { createPayout } from './lib/action/payouts/create-payout';
import { getPayout } from './lib/action/payouts/get-payout';
import { startPayoutAuthorizationFlow } from './lib/action/payouts/start-payout-authorization-flow';

import { submitPaymentsProviderReturnParameters } from './lib/action/general/submit-payments-provider-return-parameters';

import { createMandate } from './lib/action/mandates/create-mandate';
import { listMandate } from './lib/action/mandates/list-mandate';
import { getMandate } from './lib/action/mandates/get-mandate';
import { startMandateAuthorizationFlow } from './lib/action/mandates/start-mandate-authorization-flow';
import { submitConsentMandate } from './lib/action/mandates/submit-consent-mandate';
import { submitMandateProviderSelection } from './lib/action/mandates/submit-mandate-provider-selection';
import { revokeMandate } from './lib/action/mandates/revoke-mandate';
import { confirmMandateFunds } from './lib/action/mandates/confirm-mandate-funds';
import { getConstraints } from './lib/action/mandates/get-constraints';

import { listOperatingAccounts } from './lib/action/merchants/list-operating-accounts';
import { getOperatingAccount } from './lib/action/merchants/get-operating-account';
import { merchantAccountGetTransactions } from './lib/action/merchants/merchant-account-get-transactions';
import { merchantAccountSetupSweeping } from './lib/action/merchants/merchant-account-setup-sweeping';
import { merchantAccountDisableSweeping } from './lib/action/merchants/merchant-account-disable-sweeping';
import { merchantAccountGetSweeping } from './lib/action/merchants/merchant-account-get-sweeping';
import { getMerchantAccountPaymentSources } from './lib/action/merchants/get-merchant-account-payment-sources';

import { createPaymentLink } from './lib/action/payment-links/create-payment-link';
import { getPaymentLink } from './lib/action/payment-links/get-payment-link';
import { getPaymentLinkPayments } from './lib/action/payment-links/get-payment-link-payments';

import { createPayment } from './lib/action/payments/create-payment';
import { startPaymentAuthorizationFlow } from './lib/action/payments/start-payment-authorization-flow';
import { submitProviderSelection } from './lib/action/payments/submit-provider-selection';
import { submitSchemeSelection } from './lib/action/payments/submit-scheme-selection';
import { submitForm } from './lib/action/payments/submit-form';
import { submitConsent } from './lib/action/payments/submit-consent';
import { submitUserAccountSelection } from './lib/action/payments/submit-user-account-selection';
import { cancelPayment } from './lib/action/payments/cancel-payment';
import { saveUserAccountPayment } from './lib/action/payments/save-user-account-payment';
import { getPayment } from './lib/action/payments/get-payment';
import { createPaymentRefund } from './lib/action/payments/create-payment-refund';
import { getPaymentRefunds } from './lib/action/payments/get-payment-refunds';
import { getPaymentRefund } from './lib/action/payments/get-payment-refund';

import { searchPaymentProviders } from './lib/action/payments-providers/search-payment-providers';
import { getPaymentProvider } from './lib/action/payments-providers/get-payment-provider';
import { PieceCategory } from '@activepieces/shared';

export const paymentsApiV3Payments = createPiece({
  displayName: 'TrueLayer',
  description: `Connect with TrueLayer to leverage secure open banking services. This integration allows seamless interaction with TrueLayer's API to manage various financial processes.`,
  auth: trueLayerCommon.auth,
  minimumSupportedRelease: '0.20.0',
  categories: [PieceCategory.PAYMENT_PROCESSING],
  logoUrl: 'https://cdn.activepieces.com/pieces/truelayer.png',
  authors: ['ahmad-swanblocks'],
  actions: [
    createPayout,
    getPayout,
    startPayoutAuthorizationFlow,
    submitPaymentsProviderReturnParameters,
    createMandate,
    listMandate,
    getMandate,
    startMandateAuthorizationFlow,
    submitConsentMandate,
    submitMandateProviderSelection,
    revokeMandate,
    confirmMandateFunds,
    getConstraints,
    listOperatingAccounts,
    getOperatingAccount,
    merchantAccountGetTransactions,
    merchantAccountSetupSweeping,
    merchantAccountDisableSweeping,
    merchantAccountGetSweeping,
    getMerchantAccountPaymentSources,
    createPaymentLink,
    getPaymentLink,
    getPaymentLinkPayments,
    createPayment,
    startPaymentAuthorizationFlow,
    submitProviderSelection,
    submitSchemeSelection,
    submitForm,
    submitConsent,
    submitUserAccountSelection,
    cancelPayment,
    saveUserAccountPayment,
    getPayment,
    createPaymentRefund,
    getPaymentRefunds,
    getPaymentRefund,
    searchPaymentProviders,
    getPaymentProvider,
    createCustomApiCallAction({
      baseUrl: () => {
        return trueLayerCommon.baseUrl;
      },
      auth: trueLayerCommon.auth,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [],
});