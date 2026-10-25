import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getOrganizationAddressAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_organization_address',
  displayName: 'Get Organization Address',
  description: 'Gets the addresses of a Zoho Books organization.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the organization addresses with their address_id, which Update Organization Address and Delete Organization Address take.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/organizations/address',
      query: { organization_id: organizationId },
    });
  },
});
