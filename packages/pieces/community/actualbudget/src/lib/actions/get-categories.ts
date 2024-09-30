import { actualBudgetAuth } from '../..';
import { createAction } from '@activepieces/pieces-framework';
import * as api from '@actual-app/api';
import { initializeAndDownloadBudget } from '../common/common';


export const getCategories = createAction({
  auth: actualBudgetAuth,
  name: 'get_categories',
  displayName: 'Get Categories',
  description: 'Get your categories',
  props: {},
  async run(context) {
    await initializeAndDownloadBudget(api, context.auth)
    const categories = await api.getCategories();
    await api.shutdown();
    return categories;
  },
});
