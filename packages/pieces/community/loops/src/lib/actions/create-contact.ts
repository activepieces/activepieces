import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsProps, loopsSchemas } from '../common/schemas';

export const createContact = createAction({
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description:
    'Creates a new contact in Loops. Returns an error if a contact with the given email already exists.',
  audience: 'both',
  outputSchema: loopsSchemas.successWithId,
  aiMetadata: {
    description:
      'Creates a new contact in Loops keyed on email, optionally setting name, internal user ID, marketing subscription status, user group, source, mailing-list memberships, and custom properties. Errors if a contact with that email already exists; use update_contact to change or upsert an existing contact. Returns the new contact ID. Not idempotent: a second call with the same email fails.',
    idempotent: false,
  },
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact.',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Your internal user ID for this contact.',
      required: false,
    }),
    subscribed: loopsProps.subscribedProp({
      description:
        'Marketing subscription status. "Default" lets Loops apply its default (subscribed).',
    }),
    ...loopsProps.contactDetailProps(),
  },
  async run(context) {
    const { email, userId, ...rest } = context.propsValue;
    const base: Record<string, unknown> = { email };
    if (userId) base['userId'] = userId;
    return loopsClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/contacts/create',
      body: loopsClient.buildContactBody({ base, props: rest }),
    });
  },
});
