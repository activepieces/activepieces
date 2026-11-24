import { createAction } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

export const getSite = createAction({
  auth: netlifyAuth,
  name: 'get_site',
  classification: 'READ',
  displayName: 'Get Site',
  description: 'Get the details of a site, including its URLs, build settings and published deploy.',
  audience: 'human',
  aiMetadata: {
    description:
      'Gets one Netlify site with its URLs, custom domain, team, build settings and currently published deploy. Use it to read a site\'s configuration or find which deploy is live; use List Site Deploys for history. Environment variables are not included (use List Environment Variables). Read-only.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.site,
  props: { siteId: netlifyProps.siteDropdown({ description: 'The site to get.' }) },
  async run({ auth, propsValue }) {
    return netlifyOperations.getSite({ auth, siteId: propsValue.siteId });
  },
});

export const getSiteById = createAction({
  auth: netlifyAuth,
  name: 'get_site_by_id',
  classification: 'READ',
  displayName: 'Get Site by ID',
  description: 'Get the details of a site given its ID or domain.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets one Netlify site with its URLs, custom domain, team, build settings and currently published deploy. Use it to read a site\'s configuration or find which deploy is live; use List Site Deploys for history. Environment variables are not included (use List Environment Variables). Read-only. Get the site ID from List Sites.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.site,
  props: { siteId: netlifyProps.siteId() },
  async run({ auth, propsValue }) {
    return netlifyOperations.getSite({ auth, siteId: propsValue.siteId });
  },
});
