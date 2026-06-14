import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { createAuthClient } from '../../';

export const addSite = createAction({
  auth: googleSearchConsoleAuth,
  name: 'add_site',
  displayName: 'Add a Site',
  description: "Adds a site to the set of the user's sites in Search Console.",
  audience: 'both',
  aiMetadata: { description: "Add a site to the authenticated user's Google Search Console account so it can be managed and (after separate verification) monitored. Choose this when onboarding a new property. Requires the exact siteUrl (a URL-prefix property like 'https://example.com/' or a 'sc-domain:' property). Mutating, but adding an already-present site is effectively a no-op rather than a duplicate.", idempotent: false },
  props: {
    siteUrl: Property.ShortText({
      displayName: 'Site URL',
      required: true,
    }),
  },
  async run(context) {
    const webmasters = createAuthClient(context.auth.access_token);
    await webmasters.sites.add({
      siteUrl: context.propsValue.siteUrl,
    });
    return { success: true };
  },
});
