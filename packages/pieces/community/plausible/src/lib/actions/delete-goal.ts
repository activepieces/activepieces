import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown, goalIdDropdown } from '../common';

export const deleteGoal = createAction({
  auth: plausibleAuth,
  name: 'delete_goal',
  displayName: 'Delete Goal',
  description: 'Delete a goal from a site',
  props: {
    site_id: siteIdDropdown,
    goal_id: goalIdDropdown,
  },
  async run(context) {
    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      endpoint: `/sites/goals/${encodeURIComponent(context.propsValue['goal_id'] as string)}`,
      body: {
        site_id: context.propsValue['site_id'],
      },
    });
    return response;
  },
});
