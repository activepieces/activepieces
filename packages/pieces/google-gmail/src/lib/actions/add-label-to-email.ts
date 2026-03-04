import { createAction } from '@activepieces/pieces-framework';
export const addLabelToEmail = createAction({
  name: 'addLabelToEmail',
  displayName: 'Add Label to Email',
  description: 'Attach a label to an individual email.',
  props: {},
  async run() { throw new Error('Not implemented'); }
});