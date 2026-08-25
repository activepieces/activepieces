import { createAction } from '@activepieces/pieces-framework';
import { plausibleAuth } from '../..';
import { getGuests, siteIdDropdown } from '../common';

export const listGuests = createAction({
  auth: plausibleAuth,
  name: 'list_guests',
  displayName: 'List Guests',
  description: 'Get a list of guests for a site',
  audience: 'both',
  aiMetadata: { description: 'Lists the guest users and pending invitations for a site, with each guest\'s email, role, and status. Use to audit who has access or to find a guest email before removing access. Read-only and safe to repeat.', idempotent: true },
  props: {
    site_id: siteIdDropdown,
  },
  async run(context) {
    const guests = await getGuests(
      context.auth.secret_text,
      context.propsValue['site_id']
    );
    return { guests };
  },
});
