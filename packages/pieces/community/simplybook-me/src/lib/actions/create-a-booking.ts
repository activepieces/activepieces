import { createAction, Property } from '@activepieces/pieces-framework';

export const createABooking = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createABooking',
  displayName: 'Create a Booking',
  description: 'Create a new booking with required booking parameters.',
  props: {},
  async run() {
    // Action logic here
  },
});
