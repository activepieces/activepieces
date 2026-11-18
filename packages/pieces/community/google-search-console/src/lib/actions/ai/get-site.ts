import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../../auth';
import { commonProps } from '../../common';
import { gscInputs } from '../../common/inputs';
import { gscOps } from '../../common/operations';
import { gscShape } from '../../common/shape';
import { gscOutputSchemas } from '../../output-schemas';

export const getSite = createAction({
  auth: googleSearchConsoleAuth,
  name: 'get_site',
  classification: 'READ',
  displayName: 'Get Site',
  description: 'Gets the permission level of one Search Console property.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one Search Console property by its exact Site URL and reports the permission level and whether it is verified. Use it to check access before reading data or changing sitemaps (that needs siteOwner or siteFullUser); use List Sites to discover properties. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    site_url: commonProps.aiSiteUrl(),
  },
  outputSchema: gscOutputSchemas.getSite,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.site_url });
    const site = await gscOps.getSite({ auth: context.auth, siteUrl });
    return gscShape.siteFlat(site);
  },
});
