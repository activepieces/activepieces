import { Property } from '@activepieces/pieces-framework';

export const CONVERTKIT_API_URL = 'https://api.convertkit.com/v3/';

export const subscriberId = Property.Number({
  displayName: 'Subscriber ID',
  description: 'The subscriber ID',
  required: true,
});
