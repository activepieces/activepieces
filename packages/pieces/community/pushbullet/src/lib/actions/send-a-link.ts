import { createAction } from '@activepieces/pieces-framework';
import { bushbulletAuth } from '../common/auth';

export const sendALink = createAction({
  auth: bushbulletAuth,
  name: 'sendALink',
  displayName: 'Send a Link',
  description: 'Send a link notification',
  props: {},
  async run() {
    // Action logic here
  },
});
