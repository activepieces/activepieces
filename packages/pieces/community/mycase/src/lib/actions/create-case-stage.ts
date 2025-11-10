import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createCaseStageAction = createAction({
  auth: mycaseAuth,
  name: 'create_case_stage',
  displayName: 'Create Case Stage',
  description: 'Creates a new case stage',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createCaseStage({ name: context.propsValue.name });
  },
});

