import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksClient } from '../../../common/client';

export const listOrganizationsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_organizations',
  displayName: 'List Organizations',
  description: 'Lists the Zoho Books organizations the connection can access.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every organization the connected user belongs to, with organization_id and is_default_org. Use it to find the Organization ID other actions take; they use the default organization when it is left empty.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/organizations',
    });
  },
});
