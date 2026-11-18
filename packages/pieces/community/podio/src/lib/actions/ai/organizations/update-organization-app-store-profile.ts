import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const updateOrganizationAppStoreProfileAction = createAction({
  auth: podioAuth,
  name: 'podio_update_organization_app_store_profile',
  displayName: 'Update Organization App Store Profile',
  description: 'Updates the app store profile of an organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets fields on the app market profile of an organization; use Create Organization App Store Profile when it has none yet. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    fields: podioAiProps.json({ required: true, displayName: 'Profile Fields', description: 'The fields to set, as an object of contact fields to values, such as {"about": "...", "url": ["https://acme.com"]}.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/org/${propsValue.orgId}/appstore`, body: propsValue.fields });
  },
});
