import { createAction } from '@activepieces/pieces-framework';
export const findEmail = createAction({
  name: 'findEmail',
  displayName: 'Find Email',
  description: 'Search for email messages by query.',
  props: {},
  async run() { throw new Error('Not implemented'); }
});