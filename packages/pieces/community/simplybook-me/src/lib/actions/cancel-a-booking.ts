import { createAction, Property } from '@activepieces/pieces-framework';

export const cancelABooking = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'cancelABooking',
  displayName: 'Cancel a Booking',
  description: 'Cancel an existing booking.',
  props: {},
  async run() {
    // Action logic here
  },
});
