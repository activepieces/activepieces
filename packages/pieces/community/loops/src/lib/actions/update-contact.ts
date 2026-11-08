import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsProps, loopsSchemas } from '../common/schemas';

export const updateContact = createAction({
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description:
    'Updates a contact in Loops, or creates it if no contact matches the email or user ID.',
  audience: 'both',
  outputSchema: loopsSchemas.successWithId,
  aiMetadata: {
    description:
      'Upserts a Loops contact matched by email or internal user ID (at least one required). If both are given, Loops matches on either one and overwrites the other on the matched contact. Send only one unless you mean to change the other.. Only the fields you send are changed; omitted fields keep their current values. Use to change subscription status, names, mailing lists or custom properties. Idempotent: repeating the same update converges on the same contact state.',
    idempotent: true,
  },
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact. Required unless User ID is given.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Your internal user ID of the contact. Required unless Email is given.',
      required: false,
    }),
    subscribed: loopsProps.subscribedProp({
      description: 'Marketing subscription status. "Default" leaves the current status unchanged.',
    }),
    ...loopsProps.contactDetailProps(),
  },
  async run(context) {
    const { email, userId, ...rest } = context.propsValue;
    const trimmedEmail = (email ?? '').trim();
    const trimmedUserId = (userId ?? '').trim();
    if (!trimmedEmail && !trimmedUserId) {
      throw new Error('Provide "Email" or "User ID" to identify the contact.');
    }
    const base: Record<string, unknown> = {};
    if (trimmedEmail) base['email'] = trimmedEmail;
    if (trimmedUserId) base['userId'] = trimmedUserId;
    return loopsClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: '/contacts/update',
      body: loopsClient.buildContactBody({ base, props: rest }),
    });
  },
});
