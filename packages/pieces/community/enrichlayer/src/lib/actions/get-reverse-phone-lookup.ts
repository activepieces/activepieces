import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../auth';
import { enrichlayerApiCall } from '../common/client';
import { ENDPOINTS } from '../common/constants';

export const getReversePhoneLookup = createAction({
  name: 'get_reverse_phone_lookup',
  auth: enrichlayerAuth,
  displayName: 'Reverse Phone Lookup',
  description:
    'Find social media profiles from a phone number (3 credits)',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up the social media profiles associated with a phone number supplied in E.164 format. Pick this when a phone number is your only identifier and you want to resolve it to people/profiles; read-only and idempotent, billed per call.',
    idempotent: true,
  },
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'E.164 formatted phone number (e.g., +14155552671)',
      required: true,
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth.secret_text as string,
      ENDPOINTS.REVERSE_PHONE_LOOKUP,
      {
        phone_number: context.propsValue.phone_number,
      },
    );
  },
});
