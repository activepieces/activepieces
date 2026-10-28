import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteDashboardOutputSchema } from '../../output-schemas';

export const deleteDashboardPublicLinkAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_dashboard_public_link',
  outputSchema: metabaseDeleteDashboardOutputSchema,
  displayName: 'Delete Dashboard Public Link',
  description: 'Turn off the public link of a dashboard.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      "Disables a dashboard's public link so it no longer opens without login. A new link from Create Dashboard Public Link gets a different UUID. Needs an admin key.",
    idempotent: false,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteDashboardPublicLink({
      auth,
      dashboardId: propsValue.dashboardId,
    });
    return { deleted: true, dashboardId: propsValue.dashboardId };
  },
});
