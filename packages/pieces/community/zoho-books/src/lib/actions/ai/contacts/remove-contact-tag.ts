import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksMessageOutputSchema } from '../../../output-schemas';

export const removeContactTagAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_remove_contact_tag',
  outputSchema: zohoBooksMessageOutputSchema,
  displayName: 'Remove Contact Tag',
  description: 'Removes a reporting tag from a Zoho Books contact.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one reporting tag from a contact by the ID of its selected option; the tag itself stays in the organization. The tag_option_id comes from the tags of Get Contact; to set tag options use Update Contact Tags.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    tagOptionId: Property.ShortText({
      displayName: 'Tag Option ID',
      description: 'The tag_option_id of the tag to remove, from the tags of Get Contact.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, tagOptionId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/contacts/${encodeURIComponent(contactId)}/tags/${encodeURIComponent(tagOptionId)}`,
      query: { organization_id: organizationId },
    });
  },
});
