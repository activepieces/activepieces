import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateOrganizationAppStoreProfileOutputSchema } from '../../../output-schemas';

export const createOrganizationAppStoreProfileAction = createAction({
  auth: podioAuth,
  name: 'podio_create_organization_app_store_profile',
  outputSchema: podioCreateOrganizationAppStoreProfileOutputSchema,
  displayName: 'Create Organization App Store Profile',
  description: 'Creates the app store profile of an organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates the app market profile of an organization, only if it has none yet; use Update Organization App Store Profile to change an existing one. The organization id comes from List Organizations.',
    idempotent: false,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    fields: podioAiProps.json({ required: true, displayName: 'Profile Fields', description: 'The profile as an object of contact fields to values, such as {"name": "Acme", "mail": ["info@acme.com"], "url": ["https://acme.com"], "about": "..."}.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/org/${propsValue.orgId}/appstore`, body: propsValue.fields });
  },
});
