import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { commonProps } from '../common';
import { gscInputs } from '../common/inputs';
import { gscOps } from '../common/operations';
import { gscOutputSchemas } from '../output-schemas';

export const deleteSite = createAction({
  auth: googleSearchConsoleAuth,
  name: 'delete_site',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete a Site',
  description: "Removes a site from the set of the user's Search Console sites.",
  audience: 'human',
  aiMetadata: {
    description:
      "Removes a property picked from a list from the connected account's Search Console. Agents use Delete Site (by Site URL). A second call for the same property fails.",
    idempotent: false,
  },
  props: {
    siteUrl: commonProps.siteUrlIncludingUnverified,
  },
  outputSchema: gscOutputSchemas.deleteSite,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.siteUrl });
    await gscOps.deleteSite({ auth: context.auth, siteUrl });
    return { success: true, siteUrl };
  },
});
