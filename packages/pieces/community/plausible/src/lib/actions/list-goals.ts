import { createAction } from '@activepieces/pieces-framework';
import { plausibleAuth } from '../..';
import { getGoals, siteIdDropdown } from '../common';

export const listGoals = createAction({
  auth: plausibleAuth,
  name: 'list_goals',
  displayName: 'List Goals',
  description: 'Get a list of goals for a site',
  props: {
    site_id: siteIdDropdown,
  },
  async run(context) {
    const goals = await getGoals(
      context.auth.secret_text,
      context.propsValue['site_id']
    );
    return { goals };
  },
});
