import { createServiceAccountAction } from './create-service-account.action'
import { deleteServiceAccountAction } from './delete-service-account.action'
import { getServiceAccountAction } from './get-service-account.action'
import { listServiceAccountsAction } from './list-service-accounts.action'

export const SERVICE_ACCOUNTS_ACTIONS = [
  listServiceAccountsAction,
  createServiceAccountAction,
  getServiceAccountAction,
  deleteServiceAccountAction,
]
