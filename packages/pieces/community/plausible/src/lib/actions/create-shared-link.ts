import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const createSharedLink = createAction({
  auth: plausibleAuth,
  name: 'create_shared_link',
  displayName: 'Create Shared Link',
  description: 'Find or create a shared link for a site',
  props: {
    site_id: siteIdDropdown,
    name: Property.ShortText({
      displayName: 'Link Name',
      description: 'Name of the shared link (e.g., Wordpress)',
      required: true,
    }),
  },
  async run(context) {
    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      endpoint: '/sites/shared-links',
      body: {
        site_id: context.propsValue['site_id'],
        name: context.propsValue['name'],
      },
    });
    return response;
  },
});
