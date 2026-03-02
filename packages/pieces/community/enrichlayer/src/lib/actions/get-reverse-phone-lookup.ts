import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getReversePhoneLookup = createAction({
  name: 'get_reverse_phone_lookup',
  auth: enrichlayerAuth,
  displayName: 'Reverse Phone Lookup',
  description:
    'Find social media profiles from a phone number (3 credits)',
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
      context.auth as string,
      ENDPOINTS.REVERSE_PHONE_LOOKUP,
      {
        phone_number: context.propsValue.phone_number,
      },
    );
  },
});
