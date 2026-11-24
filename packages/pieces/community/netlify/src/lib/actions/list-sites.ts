import { createAction, Property } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

export const listSites = createAction({
  auth: netlifyAuth,
  name: 'list_sites',
  classification: 'SEARCH',
  displayName: 'List Sites',
  description: 'List the sites the connected account can access, optionally filtered by name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the Netlify sites the connected user can access across all teams, one page at a time (Per Page up to 100; ask for the next page when a full page comes back), optionally filtered by part of the site name. Each site has its ID, name, URLs, team and published deploy; use the ID with the other Netlify actions. Read-only.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.siteList,
  props: {
    name: Property.ShortText({ displayName: 'Name Contains', description: 'Only sites whose name contains this text.', required: false }),
    page: netlifyProps.page(),
    perPage: netlifyProps.perPage({ defaultValue: 50 }),
  },
  async run({ auth, propsValue }) {
    return netlifyOperations.listSites({ auth, name: propsValue.name, page: propsValue.page, perPage: propsValue.perPage });
  },
});
