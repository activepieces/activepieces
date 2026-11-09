import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetDashboardOutputSchema } from '../../output-schemas';

export const getDashboardAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_dashboard',
  outputSchema: metabaseGetDashboardOutputSchema,
  displayName: 'Get Dashboard',
  description: 'Get a dashboard with its cards, tabs and filters.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one dashboard with its dashcards (each with its own id and card_id), tabs and filter parameters. Use the dashcard ids with Run Dashboard Card Query.',
    idempotent: true,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getDashboard({
      auth,
      dashboardId: propsValue.dashboardId,
    });
  },
});
