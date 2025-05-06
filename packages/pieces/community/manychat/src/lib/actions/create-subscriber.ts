import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createSubscriber = createAction({
  name: 'createSubscriber',
  displayName: 'Create Subscriber',
  description: 'Add a new user into ManyChat via signup form or other channel.',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the subscriber',
      required: true
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the subscriber',
      required: false
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number of the subscriber',
      required: false
    }),
    whatsapp_phone: Property.ShortText({
      displayName: 'WhatsApp Phone',
      description: 'The WhatsApp phone number of the subscriber',
      required: false
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber',
      required: false
    }),
    gender: Property.ShortText({
      displayName: 'Gender',
      description: 'The gender of the subscriber',
      required: false
    }),
    has_opt_in_sms: Property.Checkbox({
      displayName: 'SMS Opt-in',
      description: 'Whether the subscriber has opted in for SMS',
      required: false
    }),
    has_opt_in_email: Property.Checkbox({
      displayName: 'Email Opt-in',
      description: 'Whether the subscriber has opted in for email',
      required: false
    }),
    consent_phrase: Property.ShortText({
      displayName: 'Consent Phrase',
      description: 'The consent phrase provided by the subscriber',
      required: false
    })
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.manychat.com/fb/subscriber/createSubscriber',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json'
      },
      body: {
        first_name: propsValue.first_name,
        last_name: propsValue.last_name,
        phone: propsValue.phone,
        whatsapp_phone: propsValue.whatsapp_phone,
        email: propsValue.email,
        gender: propsValue.gender,
        has_opt_in_sms: propsValue.has_opt_in_sms,
        has_opt_in_email: propsValue.has_opt_in_email,
        consent_phrase: propsValue.consent_phrase
      }
    });

    return response.body;
  },
});
