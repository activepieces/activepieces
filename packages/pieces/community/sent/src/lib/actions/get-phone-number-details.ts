import { createAction, Property } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentApi } from '../common/api';
import { sentProps } from '../common/props';
import { sentValues } from '../common/values';

export const getPhoneNumberDetails = createAction({
  auth: sentAuth,
  name: 'get_phone_number_details',
  classification: 'READ',
  displayName: 'Get Phone Number Details',
  description: 'Look up details of a phone number.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up a phone number using Sent number lookup. Supply an E.164 number with country code. Safe to retry.',
    idempotent: true,
  },
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Phone number including country code, for example +12025550123.',
      required: true,
    }),
    profile_id: sentProps.profile,
  },
  run: async ({ auth, propsValue }) =>
    sentApi.request({
      apiKey: auth.secret_text,
      path: `/numbers/lookup/${encodeURIComponent(
        sentValues.requiredString({
          value: propsValue.phone_number,
          label: 'Phone Number',
        })
      )}`,
      profileId: propsValue.profile_id,
    }),
});
