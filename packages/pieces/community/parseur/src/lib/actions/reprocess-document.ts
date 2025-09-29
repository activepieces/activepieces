import { createAction, Property } from '@activepieces/pieces-framework';

export const reprocessDocument = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'reprocessDocument',
  displayName: 'Reprocess Document',
  description: 'Send an existing document back through parsing (e.g. after updating template).',
  props: {},
  async run() {
    // Action logic here
  },
});
