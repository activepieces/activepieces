import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const mergeContactsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_merge_contacts',
  displayName: 'Merge Contacts',
  description: 'Merges duplicate Zoho Books contacts into one contact.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Merges the contacts in Contact IDs To Merge into the contact in Contact ID: their transactions move to it and the merged contacts are removed. It cannot be undone. Contact IDs come from List Contacts.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({
      required: true,
      description: 'ID of the contact to keep, from List Contacts.',
    }),
    contactIdsToMerge: Property.Array({
      displayName: 'Contact IDs To Merge',
      description: 'IDs of the duplicate contacts to merge into Contact ID, from List Contacts.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, contactIdsToMerge } = context.propsValue;
    const contactIdsToMergeList = zohoBooksUtils.toStringList({
      value: contactIdsToMerge,
      propName: 'Contact IDs To Merge',
    });
    if (contactIdsToMergeList.includes(contactId)) {
      throw new Error('Contact IDs To Merge must not include Contact ID, the contact to keep.');
    }
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(contactId)}/merge`,
      query: { organization_id: organizationId },
      body: { contact_ids: contactIdsToMergeList },
    });
  },
});
