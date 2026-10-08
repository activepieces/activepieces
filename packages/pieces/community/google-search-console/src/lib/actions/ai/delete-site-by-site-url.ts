import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../../auth';
import { commonProps } from '../../common';
import { gscInputs } from '../../common/inputs';
import { gscOps } from '../../common/operations';
import { gscOutputSchemas } from '../../output-schemas';

export const deleteSiteBySiteUrl = createAction({
  auth: googleSearchConsoleAuth,
  name: 'delete_site_by_site_url',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Site (by Site URL)',
  description: "Removes a property from the user's Search Console sites.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Removes a property from the connected account's Search Console list. Only this account loses it; other owners and the collected data are not affected, but a verified property must be verified again to come back. Confirm with the user first. A second call for the same property fails.",
    idempotent: false,
  },
  props: {
    site_url: commonProps.aiSiteUrl(),
  },
  outputSchema: gscOutputSchemas.deleteSiteAi,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.site_url });
    await gscOps.deleteSite({ auth: context.auth, siteUrl });
    return { success: true, site_url: siteUrl };
  },
});
