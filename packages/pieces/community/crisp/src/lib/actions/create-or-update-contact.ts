import { createAction, Property } from '@activepieces/pieces-framework';
import { crispAuth } from '../common/common';
import { crispClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createUpdateContact = createAction({
  auth: crispAuth,
  name: 'create_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Creates or updates a contact in Crisp',
  props: {
    websiteId: Property.ShortText({
      displayName: 'Website ID',
      required: true
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true
    }),
    person: Property.Object({
      displayName: 'Person Data',
      description: 'Key-value pairs of contact details',
      required: false,
      defaultValue: {
        nickname: '',
        phone: '',
        avatar: '',
        company: ''
      }
    })
  },
  async run(context) {
    return await crispClient.makeRequest(
      context.auth,
      HttpMethod.PATCH,
      `/website/${context.propsValue.websiteId}/people/profile/${context.propsValue.email}`,
      context.propsValue.person
    );
  }
});