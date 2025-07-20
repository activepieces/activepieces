import { getOrgPaymentAction } from './get-org-payment.action';
import { updateOrgPaymentAction } from './update-org-payment.action';
import { createOrgPaymentAction } from './create-org-payment.action';
import { deleteOrgPaymentAction } from './delete-org-payment.action';
import { getOrgBalanceAction } from './get-org-balance.action';
import { listOrgInvoicesAction } from './list-org-invoices.action';
import { listOrgPaymentMethodsAction } from './list-org-payment-methods.action';
import { getOrgSubscriptionAction } from './get-org-subscription.action';
import { updateOrgSubscriptionAction } from './update-org-subscription.action';
import { createOrgSubscriptionAction } from './create-org-subscription.action';
import { getUserPaymentAction } from './get-user-payment.action';
import { updateUserPaymentAction } from './update-user-payment.action';
import { createUserPaymentAction } from './create-user-payment.action';
import { deleteUserPaymentAction } from './delete-user-payment.action';
import { getUserBalanceAction } from './get-user-balance.action';
import { listUserInvoicesAction } from './list-user-invoices.action';
import { listUserPaymentMethodsAction } from './list-user-payment-methods.action';
import { getUserSubscriptionAction } from './get-user-subscription.action';
import { updateUserSubscriptionAction } from './update-user-subscription.action';
import { createUserSubscriptionAction } from './create-user-subscription.action';

export const PAYMENTS_ACTIONS = [
  getOrgPaymentAction,
  updateOrgPaymentAction,
  createOrgPaymentAction,
  deleteOrgPaymentAction,
  getOrgBalanceAction,
  listOrgInvoicesAction,
  listOrgPaymentMethodsAction,
  getOrgSubscriptionAction,
  updateOrgSubscriptionAction,
  createOrgSubscriptionAction,
  getUserPaymentAction,
  updateUserPaymentAction,
  createUserPaymentAction,
  deleteUserPaymentAction,
  getUserBalanceAction,
  listUserInvoicesAction,
  listUserPaymentMethodsAction,
  getUserSubscriptionAction,
  updateUserSubscriptionAction,
  createUserSubscriptionAction,
];
