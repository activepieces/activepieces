import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipAiProps } from '../../../common/ai-props';
import { greipPhoneOutputSchema } from '../../../output-schemas';

export const scorePhoneAction = createAction({
  auth: greipAuth,
  name: 'greip_score_phone',
  outputSchema: greipPhoneOutputSchema,
  displayName: 'Score Phone',
  description: 'Get the risk level, recommendation and reasons for a phone number.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Assess a phone number for validity and fraud risk and get a risk level, recommendation and reasons. Needs the number and the ISO 3166-1 alpha-2 country code it belongs to. Needs a Greip Premium plan.',
    idempotent: true,
  },
  props: {
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to score, e.g. +12121234567 or 2121234567.',
      required: true,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 code of the country the number belongs to, e.g. US.',
      required: true,
    }),
    userId: greipAiProps.userId({ required: false }),
  },
  async run(context) {
    const { phone, countryCode, userId } = context.propsValue;
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/score/phone/${encodeURIComponent(phone)}`,
      query: {
        country_code: countryCode,
        ...(userId ? { user_id: userId } : {}),
      },
    });
  },
});
