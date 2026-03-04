import { createAction } from '@activepieces/pieces-framework';
export const createLabel = createAction({
  name: 'createLabel',
  displayName: 'Create Label',
  description: 'Create a new user label in Gmail.',
  props: {},
  async run() { throw new Error('Not implemented'); }
});