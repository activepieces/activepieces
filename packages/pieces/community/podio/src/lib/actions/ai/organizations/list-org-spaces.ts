import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioListOrgSpacesOutputSchema } from '../../../output-schemas';

export const listOrgSpacesAction = createAction({
  auth: podioAuth,
  name: 'podio_list_org_spaces',
  outputSchema: podioListOrgSpacesOutputSchema,
  displayName: 'List Organization Spaces',
  description: 'Lists the workspaces of an organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the workspaces of an organization with their full details; use List All Organization Spaces as an organization admin to include workspaces the user is not in. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}/space/` });
    return { spaces: body, count: body.length };
  },
});
