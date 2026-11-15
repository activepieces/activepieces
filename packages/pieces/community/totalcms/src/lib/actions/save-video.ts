import { createAction, Property } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsApi } from '../common/client';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveVideoAction = createAction({
  name: 'save_video',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Save Video',
  description: 'Creates or replaces a video object from a video link.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets the video link (YouTube, Vimeo, Loom, Wistia, a direct MP4 and others) of a Total CMS video object, creating the object if the ID is new. Total CMS detects the provider and thumbnail. Repeating the call with the same link is safe.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collectionForSchema({ schema: 'video', label: 'Video' }),
    object_id: totalcmsProps.objectIdText({
      description: 'The ID of the video object. A new ID creates the object.',
    }),
    video: Property.ShortText({
      displayName: 'Video URL',
      description: 'The video page link from YouTube, Vimeo, Loom or similar.',
      required: true,
    }),
  },
  outputSchema: totalcmsOutputSchemas.video,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection ID' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object ID' });
    const url = totalcmsShape.requireId({ value: context.propsValue.video, label: 'Video URL' });
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('Video URL must start with http:// or https://.');
    }
    const object = await totalcmsApi.replaceObject({
      auth: context.auth,
      collection,
      id,
      fields: { video: url },
    });
    return totalcmsShape.typed({ collection, object });
  },
});
