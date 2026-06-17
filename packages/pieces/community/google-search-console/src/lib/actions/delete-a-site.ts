import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { createAuthClient } from '../../';
import { commonProps } from '../common';

export const deleteSite = createAction({
  auth: googleSearchConsoleAuth,
  name: 'delete_site',
  displayName: 'Delete a Site',
  description:
    "Removes a site from the set of the user's Search Console sites.",
  audience: 'both',
  aiMetadata: { description: "Remove a site (property) from the authenticated user's Google Search Console account, ending management of it. Choose this to deregister a property. Requires the exact siteUrl of an existing property; a confirmed destructive action. Not idempotent: a repeat call for an already-removed site fails.", idempotent: false },
  props: {
    siteUrl: commonProps.siteUrl,
  },
  async run(context) {
    const siteUrl = context.propsValue.siteUrl;

    if (!siteUrl) {
      throw new Error(
        'You must provide either a Site URL or select one from the list.'
      );
    }

    const webmasters = createAuthClient(context.auth.access_token);
    await webmasters.sites.delete({
      siteUrl: siteUrl,
    });

    return { success: true };
  },
});
