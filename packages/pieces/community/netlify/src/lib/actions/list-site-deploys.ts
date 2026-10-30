import { createAction } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

export const listSiteDeploys = createAction({
  auth: netlifyAuth,
  name: 'list_site_deploys',
  classification: 'SEARCH',
  displayName: 'List Site Deploys',
  description: 'List the deploys of a site, newest first.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists the deploys of one Netlify site, newest first, one page at a time (Per Page up to 100; ask for the next page when a full page comes back). Each deploy has its ID, state, branch, commit, context and URLs; pass an ID to Get Deploy, Cancel Deploy, Restore Deploy or Lock Deploy. Read-only.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.deployList,
  props: {
    siteId: netlifyProps.siteDropdown({ description: 'The site whose deploys to list.' }),
    page: netlifyProps.page(),
    perPage: netlifyProps.perPage({ defaultValue: 100 }),
  },
  async run({ auth, propsValue }) {
    return netlifyOperations.listDeploys({ auth, siteId: propsValue.siteId, page: propsValue.page, perPage: propsValue.perPage });
  },
});

export const listSiteDeploysById = createAction({
  auth: netlifyAuth,
  name: 'list_site_deploys_by_id',
  classification: 'SEARCH',
  displayName: 'List Site Deploys by Site ID',
  description: 'List the deploys of a site given its ID or domain.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the deploys of one Netlify site, newest first, one page at a time (Per Page up to 100; ask for the next page when a full page comes back). Each deploy has its ID, state, branch, commit, context and URLs; pass an ID to Get Deploy, Cancel Deploy, Restore Deploy or Lock Deploy. Read-only. Get the site ID from List Sites.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.deployList,
  props: {
    siteId: netlifyProps.siteId(),
    page: netlifyProps.page(),
    perPage: netlifyProps.perPage({ defaultValue: 20 }),
  },
  async run({ auth, propsValue }) {
    return netlifyOperations.listDeploys({ auth, siteId: propsValue.siteId, page: propsValue.page, perPage: propsValue.perPage });
  },
});
