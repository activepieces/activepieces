import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioListAccessibleOrgSpacesOutputSchema } from '../../../output-schemas';

export const listAccessibleOrgSpacesAction = createAction({
  auth: podioAuth,
  name: 'podio_list_accessible_org_spaces',
  outputSchema: podioListAccessibleOrgSpacesOutputSchema,
  displayName: 'List Accessible Organization Spaces',
  description: 'Lists the workspaces in an organization that you can access.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the workspaces in an organization that the connected user can access; use Get Available Spaces for open ones the user can still join. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/space/org/${propsValue.orgId}/` });
    return { spaces: body, count: body.length };
  },
});
