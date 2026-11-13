import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteDashboardOutputSchema } from '../../output-schemas';

export const deleteDashboardAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_dashboard',
  outputSchema: metabaseDeleteDashboardOutputSchema,
  displayName: 'Delete Dashboard',
  description: 'Permanently delete a dashboard.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a dashboard; this cannot be undone. To move it to the trash instead (recoverable), use Update Dashboard with Archived = Yes.',
    idempotent: false,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteDashboard({
      auth,
      dashboardId: propsValue.dashboardId,
    });
    return { deleted: true, dashboardId: propsValue.dashboardId };
  },
});
