import { createAction, Property } from '@activepieces/pieces-framework';
import { getContent } from '../api';
import { cmsAuth } from '../auth';

export const getContentAction = createAction({
  name: 'get_content',
  auth: cmsAuth,
  displayName: 'Get Content',
  description: 'Get content from your Total CMS website',
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
