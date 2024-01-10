import { createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../../';

export const createOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Creates a new opportunity.',
  props: {},
  async run() {},
});
