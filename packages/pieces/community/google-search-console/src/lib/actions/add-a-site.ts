import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { gscInputs } from '../common/inputs';
import { gscOps } from '../common/operations';
import { gscOutputSchemas } from '../output-schemas';

export const addSite = createAction({
  auth: googleSearchConsoleAuth,
  name: 'add_site',
  classification: 'WRITE',
  displayName: 'Add a Site',
  description: "Adds a site to the set of the user's sites in Search Console.",
  audience: 'both',
  aiMetadata: {
    description:
      "Adds a property to the connected account's Search Console. The property stays unverified (permission siteUnverifiedUser) until someone verifies ownership in the Search Console UI; the API cannot verify it, and unverified properties return no data. Adding a property that is already there changes nothing, so it is safe to retry.",
    idempotent: true,
  },
  props: {
    siteUrl: Property.ShortText({
      displayName: 'Site URL',
      description:
        'A URL-prefix property such as "https://www.example.com/" (a missing trailing slash is added) or a domain property such as "sc-domain:example.com".',
      required: true,
    }),
  },
  outputSchema: gscOutputSchemas.addSite,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.siteUrl });
    return gscOps.addSite({ auth: context.auth, siteUrl });
  },
});
