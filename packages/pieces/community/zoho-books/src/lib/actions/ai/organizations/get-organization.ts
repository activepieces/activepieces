import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksClient } from '../../../common/client';

export const getOrganizationAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_organization',
  displayName: 'Get Organization',
  description: 'Gets the details of a Zoho Books organization.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one organization by ID: name, base currency, fiscal year, time zone, address and tax settings.',
    idempotent: true,
  },
  props: {
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Organization ID, from List Organizations.',
      required: true,
    }),
  },
  async run(context) {
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/organizations/${encodeURIComponent(context.propsValue.organizationId)}`,
    });
  },
});
