import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { prooftellAuth } from '../auth';
import { prooftellApi } from '../common';

export const lookUpPhoneNumber = createAction({
  auth: prooftellAuth,
  name: 'look_up_phone_number',
  classification: 'READ',
  errorHandlingOptions: {
    retryOnFailure: { defaultValue: true },
    continueOnFailure: { defaultValue: false },
  },
  displayName: 'Look up a phone number',
  description:
    'Whether the number is valid, its formats and country, then by level its line type, current carrier, line status or fraud score. Charged per check from your balance; the sandbox is free.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up one phone number with ProofTell: validity, the E.164 and other formats, the country, and at the chosen level the line type, the carrier it is on today, whether it is on the network right now, or a 0–100 fraud score. To read a phone, an email and an IP together as one risk score, use Assess the risk of an identity instead. Above basic, a number that was judged is charged from the balance; basic and a number that could not be parsed are free; a retry is charged again.',
  },
  props: {
    phone: Property.ShortText({
      displayName: 'Phone number',
      description: 'E.164 preferred, such as +447700900123. A number in national format needs its country.',
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'ISO 3166-1 alpha-2 code, such as GB, for a number in national format.',
      required: false,
    }),
    level: Property.StaticDropdown({
      displayName: 'Level',
      description: 'Each level includes the ones before it. Basic is free; the other levels are charged per check.',
      required: true,
      defaultValue: 'line_type',
      options: {
        options: [
          { label: 'Basic', value: 'basic' },
          { label: 'Line type', value: 'line_type' },
          { label: 'Current carrier', value: 'current_carrier' },
          { label: 'Line status', value: 'line_status' },
          { label: 'Fraud score', value: 'fraud_score' },
        ],
      },
    }),
  },
  async run(context) {
    const { phone, country, level } = context.propsValue;
    return prooftellApi.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/phone',
      body: { phone, country, level },
    });
  },
});
