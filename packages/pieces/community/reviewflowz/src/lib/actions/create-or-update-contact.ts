import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzContacts } from '../common/contacts';

export const createOrUpdateContactAction = createAction({
  auth: reviewflowzAuth,
  name: 'create_or_update_contact',
  classification: 'WRITE',
  displayName: 'Create or Update Contact',
  description: 'Saves a customer, found by email or phone, without sending them anything.',
  audience: 'both',
  aiMetadata: {
    description:
      'Upsert a Reviewflowz contact keyed on email or phone: an existing contact is updated, otherwise one is created. Sends nothing; use Send Review Request to ask for a review. Safe to retry.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email or phone is needed. An email or phone we know updates that contact.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone number',
      description: 'International format, like +14155550100.',
      required: false,
    }),
    first_name: Property.ShortText({ displayName: 'First name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last name', required: false }),
    contact_fields: reviewflowzContacts.attributesProp(),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    if (!input.email && !input.phone) {
      throw new Error('Send the email or the phone number of the contact.');
    }
    return reviewflowzContacts.upsertContact({
      auth,
      contact: {
        email: input.email,
        phone: input.phone,
        first_name: input.first_name,
        last_name: input.last_name,
        attributes: reviewflowzContacts.attributesFrom(input.contact_fields),
      },
    });
  },
});
