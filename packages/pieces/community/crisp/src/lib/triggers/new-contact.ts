// src/actions/create-update-contact.ts
import { createAction } from '@activepieces/pieces-framework';
import { crispAuth } from '../common/common';
import { crispClient } from '../common/client';

export const createUpdateContact = createAction({
  name: 'create_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Creates or updates a contact in Crisp',
  props: {
    authentication: crispAuth,
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
      required: false
    })
  },
  async run(context) {
    return await crispClient.makeRequest(
      context.propsValue.authentication.access_token,
      HttpMethod.PATCH,
      `/website/${context.propsValue.websiteId}/people/profile/${context.propsValue.email}`,
      context.propsValue.person
    );
  }
});