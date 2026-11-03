import { createAction, Property } from '@activepieces/pieces-framework';
import { proweblookAuth } from '../auth';
import { proweblookApi } from '../common/client';
import { checkWhatsappOutputSchema } from '../common/output-schemas';
import { CheckWhatsappData } from '../common/types';

export const checkWhatsappAction = createAction({
  auth: proweblookAuth,
  name: 'check_whatsapp',
  classification: 'READ',
  audience: 'both',
  displayName: 'Check WhatsApp Number',
  description:
    'Check whether an E.164 phone number is registered on WhatsApp without sending any message or OTP.',
  outputSchema: checkWhatsappOutputSchema,
  aiMetadata: {
    description:
      'Checks whether an E.164 international phone number (starting with +) is registered on WhatsApp via ProWebLook. Sends no message or OTP and returns on_whatsapp or not_on_whatsapp.',
    idempotent: true,
  },
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number (E.164)',
      description:
        'Phone number in E.164 international format starting with + (e.g. +12025550123). Sends no message or OTP.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const phoneNumber = propsValue.phone_number.trim();
    if (!phoneNumber) {
      throw new Error('Phone Number cannot be empty.');
    }
    if (!phoneNumber.startsWith('+')) {
      throw new Error(
        'Phone Number must be in E.164 international format starting with + (e.g. +12025550123).'
      );
    }

    return await proweblookApi.post<CheckWhatsappData>({
      apiKey: auth.secret_text.trim(),
      operation: 'check_whatsapp',
      body: { phone_number: phoneNumber },
    });
  },
});
