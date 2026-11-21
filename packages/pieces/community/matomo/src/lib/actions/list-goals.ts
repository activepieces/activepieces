import { createAction } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps } from '../common/props';

export const listGoalsAction = createAction({
  name: 'list_goals',
  classification: 'SEARCH',
  auth: matomoAuth,
  displayName: 'List Goals',
  description: 'List the conversion goals configured on a Matomo site.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the conversion goals configured on a Matomo site, with idgoal, name, description, match_attribute (url, title, event_category, manually, ...), pattern, pattern_type and revenue. Use the idgoal with Get Goal Conversions. siteId is optional (connection site otherwise). Read-only.',
    idempotent: true,
  },
  props: {
    siteId: matomoProps.siteIdDropdown(),
  },
  outputSchema: {
    fields: [
      { key: 'count', label: 'Goals Found', format: 'number' },
      {
        key: 'goals',
        label: 'Goals',
        labelKey: 'name',
        listItems: [
          { key: 'idgoal', label: 'Goal ID' },
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          { key: 'match_attribute', label: 'Match Attribute' },
          { key: 'pattern', label: 'Pattern' },
          { key: 'pattern_type', label: 'Pattern Type' },
          { key: 'revenue', label: 'Revenue', format: 'number' },
        ],
      },
    ],
  },
  async run(context) {
    const response = await matomoApi.call({
      auth: context.auth.props,
      method: 'Goals.getGoals',
      idSite: context.propsValue.siteId,
    });
    const goals = matomoApi.toArray(response).filter(matomoApi.isRecord).map((goal) => ({
      idgoal: goal['idgoal'],
      name: goal['name'],
      description: goal['description'] ?? '',
      match_attribute: goal['match_attribute'],
      pattern: goal['pattern'],
      pattern_type: goal['pattern_type'],
      revenue: goal['revenue'],
    }));
    return { count: goals.length, goals };
  },
});
