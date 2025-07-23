import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';

export const removeTagFromContact = createAction({
  auth: systemeIoAuth,
  name: 'removeTagFromContact',
  displayName: 'Remove Tag from Contact',
  description: 'Remove a tag from an existing contact',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to remove the tag from',
      required: true,
    }),
    tagName: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to remove',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, tagName } = context.propsValue;
    
    const response = await systemeIoCommon.apiCall({
      method: HttpMethod.DELETE,
      url: `/contacts/${contactId}/tags/${tagName}`,
      auth: context.auth,
    });

    return response;
  },
});
