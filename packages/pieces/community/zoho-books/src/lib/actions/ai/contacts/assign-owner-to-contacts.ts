import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const assignOwnerToContactsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_assign_owner_to_contacts',
  displayName: 'Assign Owner to Contacts',
  description: 'Assigns a Zoho Books user as the owner of several contacts at once.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a Zoho Books user the owner of up to 200 contacts in one call, replacing their current owners. Use Assign Contact Owner for a single contact.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactIds: Property.Array({
      displayName: 'Contact IDs',
      description:
        'Up to 200 contact IDs, from List Contacts, e.g. ["460000000026049", "460000000026050"].',
      required: true,
    }),
    ownerId: Property.ShortText({
      displayName: 'Owner ID',
      description:
        'User ID of the Zoho Books user to make the owner, e.g. the owner_id of another contact from Get Contact.',
      required: true,
    }),
  },
  async run(context) {
    const { contactIds, ownerId } = context.propsValue;
    const contactIdsList = zohoBooksUtils.toStringList({
      value: contactIds,
      propName: 'Contact IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/contacts/owner',
      query: {
        organization_id: organizationId,
        contact_ids: contactIdsList.join(','),
        owner_id: ownerId,
      },
    });
  },
});
