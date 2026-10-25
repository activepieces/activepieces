import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const listAllContactAddressesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_all_contact_addresses',
  displayName: 'List All Contact Addresses',
  description: 'Lists the addresses of all Zoho Books contacts.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the addresses of every contact in the organization with their address_id and contact_id. Use List Contact Addresses for one contact. Returns one page; page_context.has_more_page tells whether to fetch the next page.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    page: zohoBooksAiProps.page(),
    perPage: zohoBooksAiProps.perPage(),
  },
  async run(context) {
    const { page, perPage } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/contacts/address',
      query: { organization_id: organizationId, ...zohoBooksUtils.pageQuery({ page, perPage }) },
    });
  },
});
