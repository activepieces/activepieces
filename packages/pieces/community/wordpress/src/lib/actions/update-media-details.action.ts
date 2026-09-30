import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { mediaEditOutputSchema } from '../output-schemas';

export const updateMediaDetailsAction = createAction({
  auth: wordpressAuth,
  name: 'update_media_details',
  classification: 'WRITE',
  displayName: 'Update Media Details',
  description: 'Changes the title, alt text, caption, description or attached post of a media file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates the details of an existing WordPress media item by ID, sending only the fields you supply; the file itself is not replaced. Use it to add alt text or a caption after upload_media. Safe to retry with the same input.',
    idempotent: true,
  },
  outputSchema: mediaEditOutputSchema,
  props: {
    media_id: Property.Number({
      displayName: 'Media ID',
      description: 'ID of the media item, from list_media or upload_media.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title. Leave empty to keep the current value.',
      required: false,
    }),
    alt_text: Property.ShortText({
      displayName: 'Alt Text',
      description: 'New alternative text. Leave empty to keep the current value.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'New caption. Leave empty to keep the current value.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description. Leave empty to keep the current value.',
      required: false,
    }),
    post: Property.Number({
      displayName: 'Attach To Post ID',
      description: 'ID of the post or page to attach the file to. Leave empty to keep the current value.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = wordpressContent.requireWholeNumber({ value: propsValue.media_id, propName: 'Media ID' });
    const body = wordpressContent.buildMediaDetailsBody({ values: propsValue });
    wordpressContent.requirePatch({ body });
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.POST,
      path: `/media/${id}`,
      body,
    });
    return response.body;
  },
});
