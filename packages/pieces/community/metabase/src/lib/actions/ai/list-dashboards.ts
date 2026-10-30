import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListDashboardsOutputSchema } from '../../output-schemas';

export const listDashboardsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_dashboards',
  outputSchema: metabaseListDashboardsOutputSchema,
  displayName: 'List Dashboards',
  description: 'List dashboards.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the dashboards the connection can see, optionally only your own or archived ones. Metabase returns the whole list in one call; use Search to find a dashboard by name.',
    idempotent: true,
  },
  props: {
    filter: Property.StaticDropdown({
      displayName: 'Filter',
      description:
        'Which dashboards to return. Empty = all non-archived dashboards.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Created by me', value: 'mine' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const dashboards = await metabaseApi.listDashboards({
      auth,
      filter: propsValue.filter,
    });
    return { dashboards, count: dashboards.length };
  },
});
