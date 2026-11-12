import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioListAllOrgSpacesAdminOutputSchema } from '../../../output-schemas';

export const listAllOrgSpacesAdminAction = createAction({
  auth: podioAuth,
  name: 'podio_list_all_org_spaces_admin',
  outputSchema: podioListAllOrgSpacesAdminOutputSchema,
  displayName: 'List All Organization Spaces',
  description: 'Lists every workspace in an organization, including ones you are not a member of.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every workspace in an organization with its member count and last activity, including workspaces the user is not in (their name and url are then left out); use List Organization Spaces for only the workspaces the user can see. Requires organization admin rights. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}/all_spaces/` });
    return { spaces: body, count: body.length };
  },
});
