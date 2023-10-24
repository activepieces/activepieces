import { Property } from '@activepieces/pieces-framework';

export const subscriberId = Property.ShortText({
  displayName: 'Subscriber Id',
  description: undefined,
  required: true,
});
