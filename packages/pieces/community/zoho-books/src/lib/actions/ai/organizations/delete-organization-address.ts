import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteOrganizationAddressAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_organization_address',
  displayName: 'Delete Organization Address',
  description: 'Deletes an address of a Zoho Books organization.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes an organization address. It cannot be undone. Needs the admin role in Zoho Books.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    addressId: Property.ShortText({
      displayName: 'Address ID',
      description: 'Address ID, from Get Organization Address or Create Organization Address.',
      required: true,
    }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/organizations/address/${encodeURIComponent(context.propsValue.addressId)}`,
      query: { organization_id: organizationId },
    });
  },
});
