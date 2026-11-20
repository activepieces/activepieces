import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { gscInputs } from '../common/inputs';
import { gscOps } from '../common/operations';
import { gscOutputSchemas } from '../output-schemas';

export const addSite = createAction({
  auth: googleSearchConsoleAuth,
  name: 'add_site',
  classification: 'WRITE',
  displayName: 'Add a Site',
  description: 'Adds a site to your Search Console properties.',
  audience: 'both',
  aiMetadata: {
    description:
      "Adds a property to the connected account's Search Console. The property stays unverified (permission siteUnverifiedUser) until someone verifies ownership in the Search Console UI; the API cannot verify it, and unverified properties return no data. Adding a property that is already there changes nothing, so it is safe to retry.",
    idempotent: true,
  },
  props: {
    siteUrl: Property.ShortText({
      displayName: 'Site URL',
      description: 'https://example.com/ or sc-domain:example.com. A missing slash is added.',
      placeholder: 'https://www.example.com/',
      required: true,
    }),
    info: Property.MarkDown({
      value: 'New sites stay unverified until you verify ownership in Search Console.',
      variant: MarkdownVariant.INFO,
    }),
  },
  propertyGroups: [
    {
      key: 'site',
      display: 'section',
      label: 'New Site',
      icon: 'inbox',
      props: ['siteUrl', 'info'],
    },
  ],
  outputSchema: gscOutputSchemas.addSite,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.siteUrl });
    return gscOps.addSite({ auth: context.auth, siteUrl });
  },
});
