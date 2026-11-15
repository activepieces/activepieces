import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseLists } from '../../common/lists';
import { discourseSchemas } from '../../common/schemas';

export const listLatestTopicsAction = createAction({
  auth: discourseAuth,
  name: 'list_latest_topics',
  classification: 'SEARCH',
  displayName: 'List Latest Topics',
  description: 'Lists the latest Discourse topics, 30 per page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the most recently active public Discourse topics visible to the API user, 30 per page (page starts at 0), optionally ordered by created, activity, views, posts or likes. Use Search for keyword queries and List Category Topics for one category. Read-only.',
    idempotent: true,
  },
  props: {
    order: Property.StaticDropdown({
      displayName: 'Order',
      required: false,
      options: {
        disabled: false,
        options: ['default', 'created', 'activity', 'views', 'posts', 'likes', 'op_likes', 'posters', 'category'].map((value) => ({
          label: value,
          value,
        })),
      },
    }),
    ascending: Property.Checkbox({ displayName: 'Ascending', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number starting at 0.', required: false }),
  },
  outputSchema: discourseSchemas.topicPage,
  async run({ auth, propsValue }) {
    const order = propsValue.order === 'default' ? undefined : propsValue.order;
    return discourseLists.topicPage({
      auth: auth.props,
      path: '/latest.json',
      page: propsValue.page,
      query: { order, ascending: propsValue.ascending === true ? 'true' : undefined },
    });
  },
});
