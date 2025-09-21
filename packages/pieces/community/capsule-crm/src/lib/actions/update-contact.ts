import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { capsuleCrmProps } from '../common/props';

export const updateContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update fields on an existing Person or Organisation.',
  props: {
    contact_id: capsuleCrmProps.contact_id(),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: "Update the person's first name.",
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: "Update the person's last name.",
      required: false,
    }),
    organisationName: Property.ShortText({
      displayName: 'Organisation Name',
      description: "Update the organisation's name.",
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: "Update the person's job title.",
      required: false,
    }),
    about: Property.LongText({
      displayName: 'About',
      description: 'Update the biography or description for the contact.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Update the primary email address for the contact.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Update the primary phone number for the contact.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const contactId = propsValue.contact_id as number;

    return await capsuleCrmClient.updateContact(auth, contactId, {
      firstName: propsValue.firstName,
      lastName: propsValue.lastName,
      name: propsValue.organisationName,
      title: propsValue.title,
      about: propsValue.about,
      email: propsValue.email,
      phone: propsValue.phone,
    });
  },
});
