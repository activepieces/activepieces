import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';
import { reviewflowzContacts } from '../common/contacts';
import { reviewflowzProps } from '../common/props';

export const addContactToSegmentAction = createAction({
  auth: reviewflowzAuth,
  name: 'add_contact_to_segment',
  classification: 'WRITE',
  displayName: 'Add Contact to Segment',
  description: 'Saves a customer and puts them in one of your segments.',
  audience: 'both',
  aiMetadata: {
    description:
      'Upsert a Reviewflowz contact by email or phone and add it to a segment (a saved list of contacts). Adding a contact already in the segment changes nothing, so retries are safe.',
    idempotent: true,
  },
  props: {
    segment: reviewflowzProps.segment(),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone number', required: false }),
    first_name: Property.ShortText({ displayName: 'First name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last name', required: false }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    if (!input.email && !input.phone) {
      throw new Error('Send the email or the phone number of the contact.');
    }
    const contact = await reviewflowzContacts.upsertContact({
      auth,
      contact: { email: input.email, phone: input.phone, first_name: input.first_name, last_name: input.last_name },
    });
    await reviewflowzApi.call({
      auth,
      method: HttpMethod.POST,
      path: `/segments/${encodeURIComponent(String(input.segment))}/members`,
      body: { add: [contact['id']] },
    });
    return { ...contact, segment: input.segment };
  },
});
