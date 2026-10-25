import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const deleteContactsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_contacts',
  displayName: 'Delete Contacts',
  description: 'Deletes several Zoho Books contacts (customers or vendors) at once.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes several customers or vendors in one call. It cannot be undone; use Delete Contact for a single contact or Mark Contact Inactive to keep the history.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactIds: Property.Array({
      displayName: 'Contact IDs',
      description:
        'Contact IDs to delete, from List Contacts, e.g. ["460000000026049", "460000000026050"].',
      required: true,
    }),
  },
  async run(context) {
    const { contactIds } = context.propsValue;
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
      method: HttpMethod.DELETE,
      path: '/contacts',
      query: { organization_id: organizationId, contact_ids: contactIdsList.join(',') },
    });
  },
});
