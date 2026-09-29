import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uploadPostAuth } from '../auth';
import { uploadPostClient } from '../common/client';
import {
  profileDropdown,
  uploadPostForm,
  uploadPostProps,
  VIDEO_PLATFORMS,
} from '../common/props';

export const uploadVideo = createAction({
  auth: uploadPostAuth,
  name: 'upload_video',
  classification: 'WRITE',
  displayName: 'Upload Video',
  description:
    'Publish or schedule a video from a public URL to TikTok, Instagram, YouTube, LinkedIn, Facebook, X and more.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publish (or schedule) one video, given by public URL, to one or more social platforms connected to an Upload-Post profile. Use Upload Photos for images or carousels and Upload Text for text-only posts. Each call creates new posts, so retries publish duplicates.',
    idempotent: false,
  },
  props: {
    profile: profileDropdown,
    platforms: uploadPostProps.platforms({
      options: VIDEO_PLATFORMS,
      description:
        'Where to publish. Every selected platform must be connected to the chosen profile.',
    }),
    video_url: Property.ShortText({
      displayName: 'Video URL',
      description:
        'Public URL of the video file (for example an MP4 in cloud storage). Upload-Post downloads it before publishing.',
      required: true,
    }),
    ...uploadPostProps.publishing({
      titleDisplayName: 'Title / Caption',
      titleDescription:
        'Default title or caption used on every platform. Required when publishing to YouTube.',
      titleRequired: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'Optional longer text. Used as the LinkedIn commentary, Facebook description, YouTube description and Pinterest note. Ignored by other platforms.',
      required: false,
    }),
    pinterest_board_id: uploadPostProps.pinterestBoard(),
  },
  async run(context) {
    const { profile, platforms, video_url, pinterest_board_id } =
      context.propsValue;
    const form = uploadPostForm.build({
      profile,
      platforms,
      fields: {
        video: video_url,
        ...uploadPostForm.commonFields(context.propsValue),
        pinterest_board_id: uploadPostForm.optionalString(pinterest_board_id),
      },
    });
    const response = await uploadPostClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/upload',
      body: form,
    });
    return response.body;
  },
});
