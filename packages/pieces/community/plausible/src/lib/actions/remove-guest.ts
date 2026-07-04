import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown, guestEmailDropdown } from '../common';

export const removeGuest = createAction({
  auth: plausibleAuth,
  name: 'remove_guest',
  displayName: 'Remove Guest',
  description: 'Remove a guest or invitation from a site',
  audience: 'both',
  aiMetadata: { description: 'Revokes a guest\'s access to a site (or cancels a pending invitation), identified by the site and the guest email. Use to remove someone\'s access. Idempotent in effect, since the guest ends up without access regardless of repeats.', idempotent: true },
  props: {
    site_id: siteIdDropdown,
    email: guestEmailDropdown,
  },
  async run(context) {
    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      endpoint: `/sites/guests/${encodeURIComponent(context.propsValue['email'] as string)}`,
      body: {
        site_id: context.propsValue['site_id'],
      },
    });
    return response;
  },
});
