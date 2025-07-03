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
