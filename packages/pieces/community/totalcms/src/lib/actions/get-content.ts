import { createAction, Property } from '@activepieces/pieces-framework';
import { getContent } from '../api';
import { cmsAuth } from '../auth';

export const getContentAction = createAction({
  name: 'get_content',
  auth: cmsAuth,
  displayName: 'Get Content',
  description: 'Get content from your Total CMS website',
  audience: 'both',
  aiMetadata: { description: 'Reads a single Total CMS content item by its CMS ID, where the content type is one of blog, datastore, date, depot, feed, file, gallery, image, ratings, text, toggle, or video. Use to fetch the current value of a known CMS field before displaying or updating it. Requires both the content type and the exact CMS ID (slug); read-only and idempotent.', idempotent: true },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Data Type',
      description: 'The type of data to return',
      required: true,
      options: {
        options: [
          { label: 'Blog', value: 'blog' },
          { label: 'Datastore', value: 'datastore' },
          { label: 'Date', value: 'date' },
          { label: 'Depot', value: 'depot' },
          { label: 'Feed', value: 'feed' },
          { label: 'File', value: 'file' },
          { label: 'Gallery', value: 'gallery' },
          { label: 'Image', value: 'image' },
          { label: 'Ratings', value: 'ratings' },
          { label: 'Text', value: 'text' },
          { label: 'Toggle', value: 'toggle' },
          { label: 'Video', value: 'video' },
        ],
      },
    }),
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the content to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const type = context.propsValue.type;
    const slug = context.propsValue.slug;
    return await getContent(context.auth, type, slug);
  },
});
