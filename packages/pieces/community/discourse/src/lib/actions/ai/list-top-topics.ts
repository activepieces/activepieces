import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseLists } from '../../common/lists';
import { discourseSchemas } from '../../common/schemas';

export const listTopTopicsAction = createAction({
  auth: discourseAuth,
  name: 'list_top_topics',
  classification: 'SEARCH',
  displayName: 'List Top Topics',
  description: 'Lists the most popular Discourse topics for a period.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the most popular Discourse topics for a period (daily, weekly, monthly, quarterly, yearly or all time), 30 per page starting at page 0. Use List Latest Topics for recency. Read-only.',
    idempotent: true,
  },
  props: {
    period: Property.StaticDropdown({
      displayName: 'Period',
      required: true,
      defaultValue: 'weekly',
      options: {
        disabled: false,
        options: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all'].map((value) => ({ label: value, value })),
      },
    }),
    page: Property.Number({ displayName: 'Page', description: 'Page number starting at 0.', required: false }),
  },
  outputSchema: discourseSchemas.topicPage,
  async run({ auth, propsValue }) {
    const period = PERIODS.includes(String(propsValue.period)) ? String(propsValue.period) : undefined;
    if (period === undefined) {
      throw new Error(`Period must be one of ${PERIODS.join(', ')}.`);
    }
    return discourseLists.topicPage({ auth: auth.props, path: '/top.json', page: propsValue.page, query: { period } });
  },
});

const PERIODS = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all'];
