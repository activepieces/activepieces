import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { makeClient, tarventCommon } from '../common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const getContact = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_contact',
  displayName: 'Find Contact',
  description: 'Finds a contact by your custom key data field (typically this is by email).',
  audience: 'both',
  aiMetadata: { description: 'Looks up a contact within a Tarvent audience by email (the audience\'s key field). Use to retrieve a contact or its ID before acting on it. If the audience uses a custom identifier, this returns the first contact matching the email, so target a specific record by ID when precision matters. Idempotent read-only lookup.', idempotent: true },
  props: {
    audienceId: tarventCommon.audienceId(true, ''),
    email: Property.ShortText({
      displayName: 'Contact email',
      description: 'Search for a contact by email. If the audience uses a custom contact identifier, then the search returns the FIRST contact that matches the email address. To target a specific contact, please use the contact\'s ID.',
      required: true,
      defaultValue: ''
    })
  },
  async run(context) {
    const { audienceId, email } = context.propsValue;

    await propsValidation.validateZod(context.propsValue, {
      email: z.string().min(1).max(255, 'Email has no more than 255 characters.'),
    });

    const client = makeClient(context.auth);
    return await client.listContact(audienceId, email);
  },
});
