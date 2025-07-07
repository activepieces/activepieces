import { createAction, Property } from '@activepieces/pieces-framework';

export const createSubmission = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createSubmission',
  displayName: 'Create Submission',
  description: 'Programmatically submit data to a Formstack form. Useful for integrating external data sources into forms.',
  props: {},
  async run() {
    // Action logic here
  },
});
