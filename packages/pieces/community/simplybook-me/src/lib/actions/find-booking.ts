import { createAction, Property } from '@activepieces/pieces-framework';

export const findBooking = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findBooking',
  displayName: 'Find Booking',
  description: 'Finds bookings.',
  props: {},
  async run() {
    // Action logic here
  },
});
