import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const addContactCommentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_add_contact_comment',
  displayName: 'Add Contact Comment',
  description: 'Adds a comment to a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a comment to a contact. Each call adds a new comment, so check List Contact Comments first to avoid duplicates; Delete Contact Comment removes one.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    description: Property.LongText({
      displayName: 'Comment',
      description: 'Text of the comment, e.g. "Followed up on outstanding balance."',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, description } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(contactId)}/comments`,
      query: { organization_id: organizationId },
      body: { description },
    });
  },
});
