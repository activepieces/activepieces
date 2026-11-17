import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateOrganizationAction = createAction({
  auth: podioAuth,
  name: 'podio_update_organization',
  displayName: 'Update Organization',
  description: 'Changes the name, URL label or logo of an organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the name, URL subdomain or logo of an organization; only the fields given are sent, and renaming does not change the URL. The organization id comes from List Organizations and the logo file id from Upload File.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    name: podioAiProps.text({ required: false, displayName: 'Name', description: 'The new name of the organization.' }),
    urlLabel: podioAiProps.text({ required: false, displayName: 'URL Label', description: 'The new subdomain of the organization URL.' }),
    logo: podioAiProps.id({ required: false, displayName: 'Logo File ID', description: 'The file id of an image to use as the logo, from Upload File.' }),
  },
  async run({ auth, propsValue }) {
    const body = podioUtils.body({
      values: { name: propsValue.name, url_label: propsValue.urlLabel, logo: propsValue.logo ? Number(propsValue.logo) : undefined },
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one of name, urlLabel or logo.');
    }
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/org/${propsValue.orgId}`, body });
  },
});
