import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findOrCreateCaseStageAction = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_case_stage',
  displayName: 'Find or Create Case Stage',
  description: 'Finds or creates a case stage',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    const existing = await client.findCaseStage({ search: context.propsValue.search });
    if (existing && (existing as any).length > 0) return existing;
    return await client.createCaseStage({ name: context.propsValue.search });
  },
});

