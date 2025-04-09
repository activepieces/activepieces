import { getAsyncOperationAction } from './get-async-operation.action'
import { getOrgApiCallAction } from './get-org-api-call.action'
import { getUserApiCallAction } from './get-user-api-call.action'
import { listOrgApiCallsAction } from './list-org-api-calls.action'
import { listUserApiCallsAction } from './list-user-api-calls.action'

export const API_CALLS_ACTIONS = [
  getAsyncOperationAction,
  listOrgApiCallsAction,
  getOrgApiCallAction,
  listUserApiCallsAction,
  getUserApiCallAction,
]
