import { createAction, Property } from '@activepieces/pieces-framework';
import { bushbulletAuth } from '../common/auth';

export const sendANote = createAction({
  auth: bushbulletAuth,
  name: 'sendANote',
  displayName: 'send a Note',
  description: '',
  props: {},
  async run() {
    // Action logic here
  },
});
