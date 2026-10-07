import { createAction } from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import { xeroApi } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroListOrganisations = createAction({
  auth: xeroAuth,
  name: 'xero_list_organisations',
  classification: 'SEARCH',
  displayName: 'List Organisations',
  description: 'Lists the Xero organisations this connection can access.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every Xero organisation (tenant) the connection was authorised for, with its tenant ID, name and type. Call this first when an action needs an Organisation ID and the connection may cover more than one organisation. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.organisations,
  props: {},
  async run(context) {
    const items = await xeroApi.listTenants({ accessToken: context.auth.access_token });
    return { items, count: items.length };
  },
});
