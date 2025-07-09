import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';

export const subscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'subscribeProfile',
  displayName: 'Subscribe Profile',
  description: 'Subscribe one or more profiles to email marketing, SMS marketing, or both',
  props: {},
  async run() {
    // Action logic here
  },
});
