import { createAction } from '@activepieces/pieces-framework';
import { plausibleAuth } from '../..';
import { getGuests, siteIdDropdown } from '../common';

export const listGuests = createAction({
  auth: plausibleAuth,
  name: 'list_guests',
  displayName: 'List Guests',
  description: 'Get a list of guests for a site',
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
