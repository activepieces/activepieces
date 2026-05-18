import { listApiTokensAction } from './list-api-tokens.action';
import { createApiTokenAction } from './create-api-token.action';
import { getApiTokenAction } from './get-api-token.action';
import { deleteApiTokenAction } from './delete-api-token.action';

export const API_TOKENS_ACTIONS = [
  listApiTokensAction,
  createApiTokenAction,
  getApiTokenAction,
  deleteApiTokenAction,
];
