import { createAction } from '@activepieces/pieces-framework';
import { plausibleAuth } from '../..';
import { getGoals, siteIdDropdown } from '../common';

export const listGoals = createAction({
  auth: plausibleAuth,
  name: 'list_goals',
  displayName: 'List Goals',
  description: 'Get a list of goals for a site',
  audience: 'both',
  aiMetadata: { description: 'Lists the conversion goals configured for a site, including each goal\'s id, type, and display name. Use to discover existing goals or obtain a goal id before deleting one. Read-only and safe to repeat.', idempotent: true },
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
