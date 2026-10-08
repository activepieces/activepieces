import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsPolling } from '../common/polling';
import { totalcmsProps } from '../common/props';
import { totalcmsOutputSchemas } from '../output-schemas';
import { totalcmsSamples } from './samples';

export const newBlogPost = createTrigger({
  auth: cmsAuth,
  name: 'new_blog_post',
  classification: 'READ',
  displayName: 'New Blog Post',
  description: 'Triggers when a new post is added to a blog.',
  aiMetadata: {
    description:
      'Fires once for each new post added to a Total CMS blog collection, with the full post (content included). Drafts are skipped unless Include Drafts is on; a post created as a draft and published later is not reported again.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    collection: totalcmsProps.collection({ displayName: 'Blog', description: 'The blog collection to watch.', schemas: ['blog'] }),
    include_drafts: Property.Checkbox({
      displayName: 'Include Drafts',
      description: 'Also trigger for posts saved as drafts.',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: totalcmsSamples.blogPost,
  outputSchema: totalcmsOutputSchemas.blogPost,
  async onEnable(context) {
    await totalcmsPolling.enable({
      auth: context.auth,
      store: context.store,
      collection: context.propsValue.collection,
      field: 'created',
      isRepublish: context.isRepublish,
    });
  },
  async onDisable(context) {
    await totalcmsPolling.disable({ store: context.store });
  },
  async run(context) {
    const posts = await totalcmsPolling.poll({
      auth: context.auth,
      store: context.store,
      collection: context.propsValue.collection,
      field: 'created',
    });
    return posts.filter((post) => keepPost({ post, includeDrafts: context.propsValue.include_drafts === true }));
  },
  async test(context) {
    return totalcmsPolling.sample({
      auth: context.auth,
      collection: context.propsValue.collection,
      field: 'created',
      keep: (post) => keepPost({ post, includeDrafts: context.propsValue.include_drafts === true }),
    });
  },
});

function keepPost({ post, includeDrafts }: { post: Record<string, unknown>; includeDrafts: boolean }): boolean {
  return includeDrafts || post['draft'] !== true;
}
