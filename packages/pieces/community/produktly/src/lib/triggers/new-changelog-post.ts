import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';
import { produktlyProps } from '../common/props';

const triggerProps = {
  changelog: produktlyProps.changelog,
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof produktlyAuth>,
  StaticPropsValue<typeof triggerProps>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const response = await produktlyApiCall<{
      data: Array<{
        id: number;
        title: string;
        description: string;
        date: string;
        active: boolean;
        tags: Array<{ id: number; name: string; backgroundColor: string; textColor: string }>;
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: `/changelogs/${propsValue.changelog}/posts`,
      queryParams: { limit: '100' },
    });
    return response.body.data.map((post) => ({
      epochMilliSeconds: Date.parse(post.date),
      data: {
        post_id: post.id,
        changelog_id: propsValue.changelog,
        post_title: post.title,
        post_description: post.description,
        post_date: post.date,
        post_active: post.active,
        post_tags: post.tags.map((t) => t.name).join(', '),
      },
    }));
  },
};

export const newChangelogPost = createTrigger({
  auth: produktlyAuth,
  name: 'new_changelog_post',
  displayName: 'New Changelog Post',
  description: 'Fires when a new post is published in the selected changelog.',
  props: triggerProps,
  sampleData: {
    post_id: 123,
    changelog_id: 1,
    post_title: 'Welcome to the new dashboard',
    post_description: 'We rebuilt the dashboard from scratch...',
    post_date: '2024-12-15T10:00:00Z',
    post_active: true,
    post_tags: 'Product Update, UI',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
