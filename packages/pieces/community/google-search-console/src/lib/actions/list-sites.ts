import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { gscOps } from '../common/operations';
import { gscOutputSchemas } from '../output-schemas';

export const listSites = createAction({
  auth: googleSearchConsoleAuth,
  name: 'list_sites',
  classification: 'SEARCH',
  displayName: 'List Sites',
  description: "Lists the user's Search Console sites.",
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every Search Console property the connected Google account can see, with its permission level (siteOwner, siteFullUser, siteRestrictedUser, siteUnverifiedUser). Call it first to get the exact Site URL string the other actions need; unverified properties cannot be queried. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {},
  outputSchema: gscOutputSchemas.listSites,
  async run(context) {
    return gscOps.listSites({ auth: context.auth });
  },
});
