import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetOrganizationOutputSchema } from '../../../output-schemas';

export const getOrganizationAction = createAction({
  auth: podioAuth,
  name: 'podio_get_organization',
  outputSchema: podioGetOrganizationOutputSchema,
  displayName: 'Get Organization',
  description: 'Gets one organization by id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one organization: name, url, status, type, user limit, domains and the user\'s role in it. The organization id comes from List Organizations; use Get Organization by URL when only its url is known.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}` });
  },
});
