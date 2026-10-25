import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const removeContactTagAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_remove_contact_tag',
  displayName: 'Remove Contact Tag',
  description: 'Removes a reporting tag from a Zoho Books contact.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one reporting tag from a contact; the tag itself stays in the organization. Tag IDs come from the tags of Get Contact; to set tag options use Update Contact Tags.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    tagId: Property.ShortText({
      displayName: 'Tag ID',
      description: 'Reporting tag ID, from the tags of Get Contact.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, tagId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/contacts/${encodeURIComponent(contactId)}/tags/${encodeURIComponent(tagId)}`,
      query: { organization_id: organizationId },
    });
  },
});
