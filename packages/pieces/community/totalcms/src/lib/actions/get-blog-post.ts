import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsApi } from '../common/client';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsOutputSchemas } from '../output-schemas';

export const getBlogPostAction = createAction({
  name: 'get_blog_post',
  classification: 'READ',
  auth: cmsAuth,
  displayName: 'Get Blog Post',
  description: 'Gets a blog post with its full content.',
  audience: 'human',
  aiMetadata: {
    description:
      'Reads one blog post (title, content, summary, author, categories, tags, image, gallery, draft and featured flags) from a Total CMS blog collection, given the post ID. Use Find Objects to search posts first. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collection({ displayName: 'Blog', description: 'The blog collection.', schemas: ['blog'] }),
    object_id: totalcmsProps.object({ displayName: 'Post', description: 'The blog post to get.' }),
  },
  outputSchema: totalcmsOutputSchemas.blogPost,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Blog' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Post' });
    const object = await totalcmsApi.getObject({ auth: context.auth, collection, id });
    return totalcmsShape.typed({ collection, object });
  },
});
