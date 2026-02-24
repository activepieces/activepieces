import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { phoneNumberIdDropdown } from '../common/props';

export const sendContact = createAction({
  auth: kapsoAuth,
  name: 'send_contact',
  displayName: 'Send Contact',
  description: 'Send a contact card via WhatsApp.',
  props: {
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    formattedName: Property.ShortText({
      displayName: 'Full Name',
      description: 'The contact\'s formatted full name.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The contact\'s first name.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The contact\'s last name.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The contact\'s phone number.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The contact\'s email address.',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The contact\'s company name.',
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
