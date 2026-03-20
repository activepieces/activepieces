import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { outsetaAuth } from './auth';

// Actions — Retrieve
import { getAccountAction } from './action/get-account';
import { getPersonAction } from './action/get-person';
import { getDealAction } from './action/get-deal';

// Actions — Find or Add
import { findOrAddPersonAction } from './action/find-or-add-person';
import { findOrAddDealAction } from './action/find-or-add-deal';

// Actions — Update
import { updateAccountAction } from './action/update-account';
import { updatePersonAction } from './action/update-person';
import { updateDealAction } from './action/update-deal';

// Actions — List
import { listPersonsAction } from './action/list-persons';
import { listAccountsAction } from './action/list-accounts';

// Actions — Billing
import { changeAccountPlanAction } from './action/change-account-plan';
import { cancelSubscriptionAction } from './action/cancel-subscription';
import { removeCancellationAction } from './action/remove-cancellation';
import { addAddonUsageAction } from './action/add-addon-usage';
import { addDiscountToSubscriptionAction } from './action/add-discount-to-subscription';
import { addInvoiceAction } from './action/add-invoice';
import { addInvoicePaymentAction } from './action/add-invoice-payment';

// Actions — CRM
import { addPersonToAccountAction } from './action/add-person-to-account';
import { removePersonFromAccountAction } from './action/remove-person-from-account';
import { deleteDealAction } from './action/delete-deal';
import { addCustomActivityAction } from './action/add-custom-activity';

// Actions — Email
import { subscribeToEmailListAction } from './action/subscribe-to-email-list';
import { removeSubscriberFromListAction } from './action/remove-subscriber-from-list';
import { sendConfirmationEmailAction } from './action/send-confirmation-email';

// Actions — Support
import { addCaseAction } from './action/add-case';
import { addReplyAction } from './action/add-reply';

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
    // Retrieve
    getAccountAction,
    getPersonAction,
    getDealAction,
    // Find or Add
    findOrAddPersonAction,
    findOrAddDealAction,
    // Update
    updateAccountAction,
    updatePersonAction,
    updateDealAction,
    // List
    listPersonsAction,
    listAccountsAction,
    // Billing
    changeAccountPlanAction,
    cancelSubscriptionAction,
    removeCancellationAction,
    addAddonUsageAction,
    addDiscountToSubscriptionAction,
    addInvoiceAction,
    addInvoicePaymentAction,
    // CRM
    addPersonToAccountAction,
    removePersonFromAccountAction,
    deleteDealAction,
    addCustomActivityAction,
    // Email
    subscribeToEmailListAction,
    removeSubscriberFromListAction,
    sendConfirmationEmailAction,
    // Support
    addCaseAction,
    addReplyAction,
    // Custom API call
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
