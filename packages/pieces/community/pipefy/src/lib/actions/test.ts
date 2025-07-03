import { createAction } from '@activepieces/pieces-framework';
import { auth } from '../../common';

export const test = createAction({
  auth: auth,
  name: 'test',
  displayName: 'test',
  description: 'test',
  props: {},
  async run({auth}) {
    return auth;
  },
});
