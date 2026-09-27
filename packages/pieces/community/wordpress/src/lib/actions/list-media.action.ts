import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { listMediaOutputSchema } from '../output-schemas';

export const listMediaAction = createAction({
  auth: wordpressAuth,
  name: 'list_media',
  classification: 'SEARCH',
  displayName: 'List Media',
  description: 'Lists files in the media library, optionally filtered by keyword, type or attached post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists files in the WordPress media library with their IDs, URLs, MIME types and sizes, filtered by keyword, media type, MIME type or the post they are attached to. Use it to find a media ID for featured_media in create_blog_post, or for get_media and update_media_details. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listMediaOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only files whose title, caption or file name contain this text.',
      required: false,
    }),
    media_type: Property.StaticDropdown({
      displayName: 'Media Type',
      description: 'Only files of this general type.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Audio', value: 'audio' },
          { label: 'Text', value: 'text' },
          { label: 'Application (PDF, documents, archives)', value: 'application' },
        ],
      },
    }),
    mime_type: Property.ShortText({
      displayName: 'MIME Type',
      description: 'Only files with this exact MIME type, e.g. image/png.',
      required: false,
    }),
    parent: Property.Number({
      displayName: 'Attached Post ID',
      description: 'Only files attached to this post or page ID. Use 0 for unattached files.',
      required: false,
    }),
    ...wordpressContent.pagingProps(),
  },
  async run({ auth, propsValue }) {
    const queryParams: QueryParams = wordpressContent.buildPaging({
      perPage: propsValue.per_page,
      page: propsValue.page,
    });
    if (wordpressContent.isFilledText(propsValue.search)) {
      queryParams['search'] = propsValue.search;
    }
    if (wordpressContent.isFilledText(propsValue.media_type)) {
      queryParams['media_type'] = propsValue.media_type;
    }
    if (wordpressContent.isFilledText(propsValue.mime_type)) {
      queryParams['mime_type'] = propsValue.mime_type;
    }
    if (wordpressContent.isSetNumber(propsValue.parent)) {
      queryParams['parent'] = String(
        wordpressContent.requireWholeNumber({ value: propsValue.parent, propName: 'Attached Post ID' })
      );
    }
    const result = await wordpressApi.list<WordpressRecord>({ auth, path: '/media', queryParams });
    return {
      media: result.items,
      count: result.items.length,
      total: result.total,
      total_pages: result.total_pages,
    };
  },
});
