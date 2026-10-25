import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteContactCommentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_contact_comment',
  displayName: 'Delete Contact Comment',
  description: 'Deletes a comment from a Zoho Books contact.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one comment from a contact. It cannot be undone. Comment IDs come from List Contact Comments or Add Contact Comment.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    commentId: Property.ShortText({
      displayName: 'Comment ID',
      description: 'Comment ID, from List Contact Comments or Add Contact Comment.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, commentId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/contacts/${encodeURIComponent(contactId)}/comments/${encodeURIComponent(commentId)}`,
      query: { organization_id: organizationId },
    });
  },
});
