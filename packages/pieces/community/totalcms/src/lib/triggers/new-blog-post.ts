import {
  TriggerStrategy,
  createTrigger,
  Property,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { TotalCMSAuthType, cmsAuth } from '../auth';
import { getContent } from '../api';

const polling: Polling<
  PiecePropValueSchema<typeof cmsAuth>,
  { slug: string }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const slug = propsValue.slug;
    const posts = await getContent(auth, 'blog', slug);

    return posts.data.map((post: { permalink: string }) => ({
      id: post.permalink,
      data: post,
    }));
  },
};

export const newBlogPost = createTrigger({
  name: 'new_blog_post',
  displayName: 'New Blog Post',
  description: 'Triggers when a new blog post is published',
  type: TriggerStrategy.POLLING,
  props: {
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the content to retrieve',
      required: true,
    }),
  },
  sampleData: {},
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth as TotalCMSAuthType,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth as TotalCMSAuthType,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth as TotalCMSAuthType,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth as TotalCMSAuthType,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
});
