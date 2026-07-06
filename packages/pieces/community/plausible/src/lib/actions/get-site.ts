import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const getSite = createAction({
  auth: plausibleAuth,
  name: 'get_site',
  displayName: 'Get Site',
  description: 'Get details of a site including tracker script configuration',
  audience: 'both',
  aiMetadata: { description: 'Fetches the configuration details of a single Plausible site, including its tracker script settings. Use to inspect one site identified by its domain; for enumerating sites use List Sites instead. Read-only and safe to repeat.', idempotent: true },
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
