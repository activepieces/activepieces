import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const assignContactOwnerAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_assign_contact_owner',
  displayName: 'Assign Contact Owner',
  description: 'Assigns a Zoho Books user as the owner of a contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a Zoho Books user the owner of one contact, replacing the current owner. Use Assign Owner to Contacts for several contacts at once.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    ownerId: Property.ShortText({
      displayName: 'Owner ID',
      description:
        'User ID of the Zoho Books user to make the owner, e.g. the owner_id of another contact from Get Contact.',
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
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/owner`,
      query: { organization_id: organizationId, owner_id: context.propsValue.ownerId },
    });
  },
});
