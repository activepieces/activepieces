import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { saveContent } from '../api';
import { cmsAuth } from '../auth';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const saveVideoAction = createAction({
  name: 'save_video',
  auth: cmsAuth,
  displayName: 'Save Video Content',
  description: 'Save video content to Total CMS',
  audience: 'both',
  aiMetadata: { description: 'Sets a video-type CMS field in Total CMS, identified by its CMS ID (slug), to a given video URL (must be a valid URL). Use to write or update the stored video reference. Idempotent: the value is keyed on the slug, so repeating with the same URL leaves the same result.', idempotent: true },
  props: {
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the content to save',
      required: true,
    }),
    video: Property.ShortText({
      displayName: 'Video URL',
      description: 'The URL of the video to save',
      required: true,
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      video: z.string().url(),
    });

    const slug = context.propsValue.slug;
    const video = context.propsValue.video;
    return await saveContent(context.auth, 'video', slug, {
      nodecode: true,
      video: video,
    });
  },
});
