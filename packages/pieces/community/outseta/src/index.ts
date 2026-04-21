import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { outsetaAuth } from './auth';

// Actions — Retrieve
import { getAccountAction } from './action/get-account';
import { getPersonAction } from './action/get-person';
import { getDealAction } from './action/get-deal';

// Actions — Create
import { createAccountAction } from './action/create-account';
import { createDealAction } from './action/create-deal';

// Actions — Delete
import { deletePersonAction } from './action/delete-person';
import { deleteAccountAction } from './action/delete-account';

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
import { listDealsAction } from './action/list-deals';

// Actions — Billing
import { changeAccountPlanAction } from './action/change-account-plan';
import { cancelSubscriptionAction } from './action/cancel-subscription';
import { removeCancellationAction } from './action/remove-cancellation';
import { addAddonUsageAction } from './action/add-addon-usage';
import { addDiscountToSubscriptionAction } from './action/add-discount-to-subscription';
import { addInvoiceAction } from './action/add-invoice';
import { addInvoicePaymentAction } from './action/add-invoice-payment';

// Actions — CRM
import { manageAccountMembershipAction } from './action/manage-account-membership';
import { deleteDealAction } from './action/delete-deal';
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
import { newSubscriptionEventTrigger } from './triggers/new-subscription-event';
import { newInvoiceEventTrigger } from './triggers/new-invoice-event';
import { newSupportTicketEventTrigger } from './triggers/new-support-ticket-event';

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
    newSubscriptionEventTrigger,
    newInvoiceEventTrigger,
    newSupportTicketEventTrigger,
  ],
  actions: [
    // Retrieve
    getAccountAction,
    getPersonAction,
    getDealAction,
    // Create
    createAccountAction,
    createDealAction,
    // Delete
    deletePersonAction,
    deleteAccountAction,
    deleteDealAction,
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
    listDealsAction,
    // Billing
    changeAccountPlanAction,
    cancelSubscriptionAction,
    removeCancellationAction,
    addAddonUsageAction,
    addDiscountToSubscriptionAction,
    addInvoiceAction,
    addInvoicePaymentAction,
    // CRM
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
