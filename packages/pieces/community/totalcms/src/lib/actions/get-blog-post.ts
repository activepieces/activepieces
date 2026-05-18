import { createAction, Property } from '@activepieces/pieces-framework';
import { getBlogPost } from '../api';
import { cmsAuth } from '../auth';

export const getBlogPostAction = createAction({
  name: 'get_blog_post',
  auth: cmsAuth,
  displayName: 'Get Blog Post',
  description: 'Get a blog post from Total CMS',
  props: {
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the content to retrieve',
      required: true,
    }),
    permalink: Property.ShortText({
      displayName: 'Permalink',
      description: 'The permalink of the post to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const slug = context.propsValue.slug;
    const permalink = context.propsValue.permalink;
    return await getBlogPost(context.auth, slug, permalink);
  },
});
