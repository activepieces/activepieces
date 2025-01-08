import { pipedriveAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';

export const createOrganizationAction = createAction({
  auth: pipedriveAuth,
  name: 'create-organization',
  displayName: 'Create Organization',
  description: 'Creates a new organization',
  props: {},
  async run(context) {},
});
