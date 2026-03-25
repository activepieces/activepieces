import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { brevoAuth } from '../auth';
import { brevoRequest, compactObject } from '../common/client';

export const createContactAction = createAction({
  name: 'create_contact',
  displayName: 'Create Or Update Contact',
  description: 'Create a new Brevo contact or update it if it already exists.',
  auth: brevoAuth,
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    emailBlacklisted: Property.Checkbox({ displayName: 'Email Blacklisted', required: false }),
    listIds: Property.Array({ displayName: 'List IDs', required: false }),
  },
  async run(context) {
    return brevoRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/contacts',
      body: compactObject({
        email: context.propsValue.email,
        updateEnabled: true,
        attributes: compactObject({
          FIRSTNAME: context.propsValue.firstName,
          LASTNAME: context.propsValue.lastName,
        }),
        emailBlacklisted: context.propsValue.emailBlacklisted,
        listIds: context.propsValue.listIds,
      }),
    });
  },
});
