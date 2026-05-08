import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { outsetaAuth } from './auth';

// Actions — Retrieve
import { getAccountAction } from './action/get-account';
import { getPersonAction } from './action/get-person';
import { getDealAction } from './action/get-deal';
import { getLastPaymentAction } from './action/get-last-payment';

// Actions — Create / Find or Add
import { createAccountAction } from './action/create-account';
import { createDealAction } from './action/create-deal';
import { findOrAddPersonAction } from './action/find-or-add-person';
import { findOrAddDealAction } from './action/find-or-add-deal';

// Actions — Update
import { updateAccountAction } from './action/update-account';
import { updatePersonAction } from './action/update-person';
import { updateDealAction } from './action/update-deal';

// Actions — Delete
import { deleteAccountAction } from './action/delete-account';
import { deletePersonAction } from './action/delete-person';
import { deleteDealAction } from './action/delete-deal';

// Actions — List
import { listAccountsAction } from './action/list-accounts';
import { listPersonsAction } from './action/list-persons';
import { listDealsAction } from './action/list-deals';

// Actions — Billing (Subscription)
import { changeAccountPlanAction } from './action/change-account-plan';
import { cancelSubscriptionAction } from './action/cancel-subscription';
import { removeCancellationAction } from './action/remove-cancellation';
import { addDiscountToSubscriptionAction } from './action/add-discount-to-subscription';
import { addAddonUsageAction } from './action/add-addon-usage';

// Actions — Billing (Invoice)
import { addInvoiceAction } from './action/add-invoice';
import { addInvoicePaymentAction } from './action/add-invoice-payment';

// Actions — CRM (Membership / Activity)
import { manageAccountMembershipAction } from './action/manage-account-membership';
import { addCustomActivityAction } from './action/add-custom-activity';

// Actions — Email
import { manageEmailListSubscriptionAction } from './action/manage-email-list-subscription';
import { sendConfirmationEmailAction } from './action/send-confirmation-email';

// Actions — Support
import { addCaseAction } from './action/add-case';
import { addReplyAction } from './action/add-reply';

// Triggers
import { newAccountEventTrigger } from './triggers/new-account-event';
import { newPersonEventTrigger } from './triggers/new-person-event';
import { newDealEventTrigger } from './triggers/new-deal-event';
import { newTaskEventTrigger } from './triggers/new-task-event';
import { newPlanEventTrigger } from './triggers/new-plan-event';
import { newAddOnEventTrigger } from './triggers/new-add-on-event';

export const outseta = createPiece({
  displayName: 'Outseta',
  description: 'Triggers and actions for Outseta CRM and Billing',
  auth: outsetaAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/outseta.png',
  authors: ['bst1n', 'sanket-a11y'],
  categories: [PieceCategory.SALES_AND_CRM],
  triggers: [
    newAccountEventTrigger,
    newPersonEventTrigger,
    newDealEventTrigger,
    newTaskEventTrigger,
    newPlanEventTrigger,
    newAddOnEventTrigger,
  ],
  actions: [
    // Retrieve
    getAccountAction,
    getPersonAction,
    getDealAction,
    getLastPaymentAction,
    // Create / Find or Add
    createAccountAction,
    createDealAction,
    findOrAddPersonAction,
    findOrAddDealAction,
    // Update
    updateAccountAction,
    updatePersonAction,
    updateDealAction,
    // Delete
    deleteAccountAction,
    deletePersonAction,
    deleteDealAction,
    // List
    listAccountsAction,
    listPersonsAction,
    listDealsAction,
    // Billing — Subscription
    changeAccountPlanAction,
    cancelSubscriptionAction,
    removeCancellationAction,
    addDiscountToSubscriptionAction,
    addAddonUsageAction,
    // Billing — Invoice
    addInvoiceAction,
    addInvoicePaymentAction,
    // CRM — Membership / Activity
    manageAccountMembershipAction,
    addCustomActivityAction,
    // Email
    manageEmailListSubscriptionAction,
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
