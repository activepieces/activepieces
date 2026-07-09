import { actualBudgetAuth } from '../..';
import { createAction } from '@activepieces/pieces-framework';
import * as api from '@actual-app/api';
import { initializeAndDownloadBudget } from '../common/common';


export const getCategories = createAction({
  auth: actualBudgetAuth,
  name: 'get_categories',
  displayName: 'Get Categories',
  description: 'Get your categories',
  audience: 'both',
  aiMetadata: { description: 'Lists all budget categories from an Actual Budget server. Use it to discover available categories and their IDs, typically to resolve a category ID before importing a transaction. Takes no input; read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    await initializeAndDownloadBudget(api, context.auth.props)
    const categories = await api.getCategories();
    await api.shutdown();
    return categories;
  },
});
