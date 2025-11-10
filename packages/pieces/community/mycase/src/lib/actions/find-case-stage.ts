import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findCaseStageAction = createAction({
  auth: mycaseAuth,
  name: 'find_case_stage',
  displayName: 'Find Case Stage',
  description: 'Finds a case stage',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.findCaseStage({ search: context.propsValue.search });
  },
});

