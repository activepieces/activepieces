import { listServiceAccountsAction } from './list-service-accounts.action';
import { createServiceAccountAction } from './create-service-account.action';
import { getServiceAccountAction } from './get-service-account.action';
import { deleteServiceAccountAction } from './delete-service-account.action';

export const SERVICE_ACCOUNTS_ACTIONS = [
  listServiceAccountsAction,
  createServiceAccountAction,
  getServiceAccountAction,
  deleteServiceAccountAction,
];
