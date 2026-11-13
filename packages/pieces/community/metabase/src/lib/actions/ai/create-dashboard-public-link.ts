import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateCardPublicLinkOutputSchema } from '../../output-schemas';

export const createDashboardPublicLinkAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_dashboard_public_link',
  outputSchema: metabaseCreateCardPublicLinkOutputSchema,
  displayName: 'Create Dashboard Public Link',
  description: 'Create a public, no-login link to a dashboard.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a dashboard viewable by anyone with the link and returns its public UUID; the link is {base URL}/public/dashboard/{uuid}. Returns the existing UUID if already shared. Needs an admin key and public sharing enabled.',
    idempotent: true,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createDashboardPublicLink({
      auth,
      dashboardId: propsValue.dashboardId,
    });
  },
});
