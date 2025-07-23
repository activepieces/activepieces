import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { systemeIoProps } from '../common/props';

export const removeTagFromContact = createAction({
  auth: systemeIoAuth,
  name: 'removeTagFromContact',
  displayName: 'Remove Tag from Contact',
  description: 'Remove a tag from an existing contact',
  props: {
    contactId: systemeIoProps.contactIdDropdown,
    tagName: systemeIoProps.tagNameDropdown,
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
