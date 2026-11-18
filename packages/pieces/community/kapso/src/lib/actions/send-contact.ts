import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendContact = createAction({
  auth: kapsoAuth,
  name: 'send_contact',
  classification: 'WRITE',
  displayName: 'Send Contact',
  description: 'Send a contact card via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a vCard-style contact card to a WhatsApp recipient. Only the contact full name is required; phone, email, and company are optional. Each call delivers a new message, so it is not idempotent.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'Send From',
      icon: 'send',
      props: ['businessAccountId', 'phoneNumberId'],
    },
    {
      key: 'recipient',
      display: 'section',
      label: 'Send To',
      icon: 'user',
      props: ['windowInfo', 'to'],
    },
    {
      key: 'contact',
      display: 'section',
      label: 'Contact to Share',
      icon: 'user',
      props: ['formattedName', 'firstName', 'lastName', 'phone', 'email', 'company'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    formattedName: Property.ShortText({
      displayName: 'Full Name',
      description: 'The name shown on the contact card.',
      placeholder: 'Jane Doe',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      placeholder: 'Jane',
      required: false,
      width: 'half',
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      placeholder: 'Doe',
      required: false,
      width: 'half',
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'With country code.',
      placeholder: '15551234567',
      required: false,
      width: 'half',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: false,
      width: 'half',
    }),
    company: Property.ShortText({
      displayName: 'Company',
      placeholder: 'Acme Inc',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, formattedName, firstName, lastName, phone, email, company } =
      context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const contact: Record<string, unknown> = {
      name: {
        formattedName,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
      },
    };

    if (phone) {
      contact['phones'] = [{ phone, type: 'CELL' }];
    }
    if (email) {
      contact['emails'] = [{ email, type: 'WORK' }];
    }
    if (company) {
      contact['org'] = { company };
    }

    const response = await client.messages.sendContacts({
      phoneNumberId,
      to,
      contacts: [contact as any],
    });

    return response;
  },
});
