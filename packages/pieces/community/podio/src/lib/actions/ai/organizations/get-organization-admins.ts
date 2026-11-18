import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetOrganizationAdminsOutputSchema } from '../../../output-schemas';

export const getOrganizationAdminsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_organization_admins',
  outputSchema: podioGetOrganizationAdminsOutputSchema,
  displayName: 'Get Organization Admins',
  description: 'Lists the administrators of an organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the administrators of an organization with their user and profile ids. Requires organization admin rights. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}/admin/` });
    return { admins: body, count: body.length };
  },
});
