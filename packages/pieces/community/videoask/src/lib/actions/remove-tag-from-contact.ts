import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { organizationIdDropdown, tagIdDropdown } from '../common/props';
import { videoaskAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const removeTagFromContact = createAction({
  auth: videoaskAuth,
  name: 'removeTagFromContact',
  displayName: 'Remove tag from contact',
  description: 'Remove a tag from a contact (respondent) in VideoAsk',
  props: {
    organizationId: organizationIdDropdown,
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The contact (respondent) id to remove the tag from',
      required: true,
    }),
    tagId: tagIdDropdown,
  },
  async run(context) {
    const { organizationId, contactId, tagId } = context.propsValue;
    const access_token = context.auth.access_token as string;

    const response = await makeRequest(
      organizationId as string,
      access_token,
      HttpMethod.PATCH,
      `/contacts/${contactId}/tags/${tagId}`,
      { action: 'remove' }
    );

    return response;
  },
});
