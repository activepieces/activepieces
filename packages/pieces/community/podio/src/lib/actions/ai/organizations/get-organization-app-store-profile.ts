import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetOrganizationAppStoreProfileOutputSchema } from '../../../output-schemas';

export const getOrganizationAppStoreProfileAction = createAction({
  auth: podioAuth,
  name: 'podio_get_organization_app_store_profile',
  outputSchema: podioGetOrganizationAppStoreProfileOutputSchema,
  displayName: 'Get Organization App Store Profile',
  description: 'Gets the app store profile of an organization.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the app market profile of an organization, if it has one. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}/appstore` });
  },
});
