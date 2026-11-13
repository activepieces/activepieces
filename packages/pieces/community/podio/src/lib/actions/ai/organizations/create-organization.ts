import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateOrganizationOutputSchema } from '../../../output-schemas';

export const createOrganizationAction = createAction({
  auth: podioAuth,
  name: 'podio_create_organization',
  outputSchema: podioCreateOrganizationOutputSchema,
  displayName: 'Create Organization',
  description: 'Creates a new Podio organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a whole new Podio organization with the connected user in it; use Create Space to add a workspace to an existing organization instead. There is no action to delete an organization, so it stays once created. The logo file id comes from Upload File.',
    idempotent: false,
  },
  props: {
    name: podioAiProps.text({ required: true, displayName: 'Name', description: 'The name of the new organization.' }),
    logo: podioAiProps.id({ required: false, displayName: 'Logo File ID', description: 'The file id of an image to use as the logo, from Upload File.' }),
  },
  async run({ auth, propsValue }) {
    const body = podioUtils.body({ values: { name: propsValue.name, logo: propsValue.logo ? Number(propsValue.logo) : undefined } });
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: '/org/', body });
  },
});
