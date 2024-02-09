import { createAction, Property } from '@activepieces/pieces-framework';
import { saveContent } from '../api';
import { cmsAuth } from '../auth';

export const saveBlogPostAction = createAction({
  name: 'save_blog_post',
  auth: cmsAuth,
  displayName: 'Save Blog Post',
  description: 'Save blog content to Total CMS',
  props: {
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the content to save',
      required: true,
    }),
    permalink: Property.ShortText({
      displayName: 'Permalink',
      description:
        'The permalink of the blog post. Ensure this is unique or it will overwrite the existing post.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the blog post',
      required: false,
    }),
    timestamp: Property.Number({
      displayName: 'Date (Unix Timestamp)',
      description: 'The date in unix timestamp format',
      required: false,
    }),
    summary: Property.LongText({
      displayName: 'Summary',
      description: 'The summary of the blog post',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the blog post',
      required: false,
    }),
    extra: Property.LongText({
      displayName: 'Extra Content',
      description: 'The extra content of the blog post',
      required: false,
    }),
    extra2: Property.LongText({
      displayName: 'Extra Content 2',
      description: 'The extra content 2 of the blog post',
      required: false,
    }),
    media: Property.ShortText({
      displayName: 'Media',
      description: 'The media of the blog post',
      required: false,
    }),
    rssTitle: Property.ShortText({
      displayName: 'RSS Title',
      description: 'The RSS title of the blog post',
      required: false,
    }),
    rssDescription: Property.ShortText({
      displayName: 'RSS Description',
      description: 'The RSS description of the blog post',
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'The author of the blog post',
      required: false,
    }),
    genre: Property.ShortText({
      displayName: 'Genre',
      description: 'The genre of the blog post',
      required: false,
    }),
    categories: Property.ShortText({
      displayName: 'Categories',
      description: 'A comma separated list of categories for the blog post',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'A comma separated list of tags for the blog post',
      required: false,
    }),
    labels: Property.ShortText({
      displayName: 'Labels',
      description: 'A comma separated list of labels for the blog post',
      required: false,
    }),
    draft: Property.Checkbox({
      displayName: 'Draft',
      description: 'Set to true to save as a draft',
      required: false,
    }),
    featured: Property.Checkbox({
      displayName: 'Featured',
      description: 'Set to true to save as a featured post',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'Set to true to save as an archived post',
      required: false,
    }),
  },
  async run(context) {
    const slug = context.propsValue.slug;
    return await saveContent(context.auth, 'blog', slug, {
      nodecode: true,
      permalink: context.propsValue.permalink,
      title: context.propsValue.title,
      timestamp: context.propsValue.timestamp?.toString(),
      summary: context.propsValue.summary,
      content: context.propsValue.content,
      extra: context.propsValue.extra,
      extra2: context.propsValue.extra2,
      media: context.propsValue.media,
      rss_title: context.propsValue.rssTitle,
      rss_description: context.propsValue.rssDescription,
      author: context.propsValue.author,
      genre: context.propsValue.genre,
      categories: context.propsValue.categories,
      tags: context.propsValue.tags,
      labels: context.propsValue.labels,
      draft: context.propsValue.draft ? 'true' : 'false',
      featured: context.propsValue.featured ? 'true' : 'false',
      archived: context.propsValue.archived ? 'true' : 'false',
    });
  },
});
