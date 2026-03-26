import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { outsetaAuth } from './auth';

// Actions
import { getAccountAction } from './action/get-account';
import { getPersonAction } from './action/get-person';
import { getAccountPlanAction } from './action/get-account-plan';
import { changeAccountPlanAction } from './action/change-account-plan';
import { cancelSubscriptionAction } from './action/cancel-subscription';
import { addAddonUsageAction } from './action/add-addon-usage';
import { updateAccountAction } from './action/update-account';
import { updatePersonAction } from './action/update-person';
import { findOrAddPersonAction } from './action/find-or-add-person';
import { findOrAddAccountAction } from './action/find-or-add-account';
import { addPersonToAccountAction } from './action/add-person-to-account';
import { addDealAction } from './action/add-deal';
import { getDealAction } from './action/get-deal';
import { updateDealAction } from './action/update-deal';
import { deleteDealAction } from './action/delete-deal';
import { subscribeToEmailListAction } from './action/subscribe-to-email-list';
import { addCustomActivityAction } from './action/add-custom-activity';

// Triggers
import { accountAddedTrigger } from './triggers/account-added';
import { accountUpdatedTrigger } from './triggers/account-updated';
import { accountDeletedTrigger } from './triggers/account-deleted';
import { accountStageUpdatedTrigger } from './triggers/account-stage-updated';
import { accountBillingInvoiceCreatedTrigger } from './triggers/account-billing-invoice-created';
import { accountBillingInvoiceDeletedTrigger } from './triggers/account-billing-invoice-deleted';
import { accountPaidSubscriptionCreatedTrigger } from './triggers/account-paid-subscription-created';
import { accountSubscriptionStartedTrigger } from './triggers/account-subscription-started';
import { accountSubscriptionAddOnsChangedTrigger } from './triggers/account-subscription-addons-changed';
import { accountSubscriptionCancellationRequestedTrigger } from './triggers/account-subscription-cancellation-requested';
import { accountSubscriptionPlanUpdatedTrigger } from './triggers/account-subscription-plan-updated';
import { accountSubscriptionPaymentCollectedTrigger } from './triggers/account-subscription-payment-collected';
import { accountSubscriptionPaymentDeclinedTrigger } from './triggers/account-subscription-payment-declined';
import { accountSubscriptionRenewalExtendedTrigger } from './triggers/account-subscription-renewal-extended';
import { personAddedTrigger } from './triggers/person-added';
import { personUpdatedTrigger } from './triggers/person-updated';
import { personDeletedTrigger } from './triggers/person-deleted';
import { dealCreatedTrigger } from './triggers/deal-created';
import { dealUpdatedTrigger } from './triggers/deal-updated';

export const outseta = createPiece({
  displayName: 'Outseta',
  description: 'Triggers and actions for Outseta CRM and Billing',
  auth: outsetaAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/outseta.png',
  authors: ['bst1n', 'sanket-a11y'],
  categories: [PieceCategory.SALES_AND_CRM],
  triggers: [
    accountAddedTrigger,
    accountUpdatedTrigger,
    accountDeletedTrigger,
    accountStageUpdatedTrigger,
    accountBillingInvoiceCreatedTrigger,
    accountBillingInvoiceDeletedTrigger,
    accountPaidSubscriptionCreatedTrigger,
    accountSubscriptionStartedTrigger,
    accountSubscriptionAddOnsChangedTrigger,
    accountSubscriptionCancellationRequestedTrigger,
    accountSubscriptionPlanUpdatedTrigger,
    accountSubscriptionPaymentCollectedTrigger,
    accountSubscriptionPaymentDeclinedTrigger,
    accountSubscriptionRenewalExtendedTrigger,
    personAddedTrigger,
    personUpdatedTrigger,
    personDeletedTrigger,
    dealCreatedTrigger,
    dealUpdatedTrigger,
  ],
  actions: [
    findOrAddAccountAction,
    findOrAddPersonAction,
    getAccountAction,
    getPersonAction,
    getDealAction,
    getAccountPlanAction,
    updateAccountAction,
    updatePersonAction,
    updateDealAction,
    addDealAction,
    addPersonToAccountAction,
    addCustomActivityAction,
    changeAccountPlanAction,
    cancelSubscriptionAction,
    addAddonUsageAction,
    subscribeToEmailListAction,
    deleteDealAction,
    createCustomApiCallAction({
      auth: outsetaAuth,
      baseUrl: (auth) => `${auth.props.domain}/api/v1`,
      authMapping: async (auth) => {
        const { apiKey, apiSecret } = auth.props;
        return {
          Authorization: `Outseta ${apiKey}:${apiSecret}`,
        };
      },
    }),
  ],
});
