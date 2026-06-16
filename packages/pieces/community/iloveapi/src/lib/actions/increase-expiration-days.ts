import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';

export const increaseExpirationDaysAction = createAction({
  auth: iloveapiAuth,
  name: 'increase_expiration_days',
  displayName: 'Increase Expiration Days',
  description:
    'Extend the expiration of a signature request by a number of days. Total cannot exceed 130 days from now.',
  audience: 'both',
  aiMetadata: {
    description:
      'Push back the expiration date of an existing signature request (by requester token) by a given number of days, where the added amount must be 1 to 130 and the resulting total cannot exceed 130 days from now. Not idempotent: each call adds days on top of the current expiration rather than setting it to an absolute date.',
    idempotent: false,
  },
  props: {
    token_requester: Property.ShortText({
      displayName: 'Requester Token',
      description: 'The "token_requester" of the signature request.',
      required: true,
    }),
    days: Property.Number({
      displayName: 'Additional Days',
      description: 'Number of days to add. Must be between 1 and 130.',
      required: true,
    }),
  },
  async run(context) {
    const { token_requester, days } = context.propsValue;
    if (!token_requester) {
      throw new Error('Requester Token is required.');
    }
    if (days === undefined || days === null || days < 1 || days > 130) {
      throw new Error('Additional Days must be between 1 and 130.');
    }

    const token = await iLoveApi.authenticate({
      publicKey: context.auth.secret_text,
    });
    return await iLoveApi.increaseExpirationDays({
      token,
      tokenRequester: token_requester,
      days,
    });
  },
});
