import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const deleteSite = createAction({
  auth: plausibleAuth,
  name: 'delete_site',
  displayName: 'Delete Site',
  description: 'Delete a site and all its data from your Plausible account. This action is permanent and may take up to 48 hours to complete.',
  props: {
    site_id: siteIdDropdown,
  },
  async run(context) {
    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      endpoint: `/sites/${encodeURIComponent(context.propsValue['site_id'])}`,
    });
    return response;
  },
});
