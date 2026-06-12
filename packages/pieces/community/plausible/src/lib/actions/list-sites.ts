import { createAction } from '@activepieces/pieces-framework';
import { plausibleAuth } from '../..';
import { getSites } from '../common';

export const listSites = createAction({
  auth: plausibleAuth,
  name: 'list_sites',
  displayName: 'List Sites',
  description: 'Get a list of sites your Plausible account can access',
  audience: 'both',
  aiMetadata: { description: 'Lists all sites the authenticated Plausible account can access, each with its domain and timezone. Use to discover available site identifiers (domains) before calling actions that require a specific site. Takes no input; read-only and safe to repeat.', idempotent: true },
  props: {},
  async run(context) {
    const sites = await getSites(context.auth.secret_text);
    return { sites };
  },
});
