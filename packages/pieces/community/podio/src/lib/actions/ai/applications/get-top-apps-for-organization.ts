import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetTopAppsOutputSchema } from '../../../output-schemas';

export const getTopAppsForOrganizationAction = createAction({
  auth: podioAuth,
  name: 'podio_get_top_apps_for_organization',
  outputSchema: podioGetTopAppsOutputSchema,
  displayName: 'Get Top Apps for Organization',
  description: 'Lists the apps the user uses the most inside one organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio apps the connected user has interacted with the most inside one organization. Across all organizations use Get Top Apps. The org id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization.' }),
  },
  async run({ auth, propsValue }) {
    const apps = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/app/org/${propsValue.orgId}/top/` });
    return { apps, count: apps.length };
  },
});
