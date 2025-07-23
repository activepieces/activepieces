import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';

export const addTagToContact = createAction({
  auth: systemeIoAuth,
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description: 'Assign a tag to an existing contact',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to add the tag to',
      required: true,
    }),
    tagName: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to add',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, tagName } = context.propsValue;
    
    const response = await systemeIoCommon.apiCall({
      method: HttpMethod.POST,
      url: `/contacts/${contactId}/tags`,
      body: {
        name: tagName,
      },
      auth: context.auth,
    });

    return response;
  },
});
