import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteOrganizationAppStoreProfileAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_organization_app_store_profile',
  displayName: 'Delete Organization App Store Profile',
  description: 'Deletes the app store profile of an organization.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes the app market profile of an organization. The organization id comes from List Organizations.',
    idempotent: false,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/org/${propsValue.orgId}/appstore` });
  },
});
