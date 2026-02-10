import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const getSite = createAction({
  auth: plausibleAuth,
  name: 'get_site',
  displayName: 'Get Site',
  description: 'Get details of a site including tracker script configuration',
  props: {
    site_id: siteIdDropdown,
  },
  async run(context) {
    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      endpoint: `/sites/${encodeURIComponent(context.propsValue['site_id'])}`,
    });
    return response;
  },
});
