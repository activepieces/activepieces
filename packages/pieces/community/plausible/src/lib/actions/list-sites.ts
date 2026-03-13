import { createAction } from '@activepieces/pieces-framework';
import { plausibleAuth } from '../..';
import { getSites } from '../common';

export const listSites = createAction({
  auth: plausibleAuth,
  name: 'list_sites',
  displayName: 'List Sites',
  description: 'Get a list of sites your Plausible account can access',
  props: {},
  async run(context) {
    const sites = await getSites(context.auth.secret_text);
    return { sites };
  },
});
