import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';

export const increaseExpirationDaysAction = createAction({
  auth: iloveapiAuth,
  name: 'increase_expiration_days',
  displayName: 'Increase Expiration Days',
  description:
    'Extend the expiration of a signature request by a number of days. Total cannot exceed 130 days from now.',
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
