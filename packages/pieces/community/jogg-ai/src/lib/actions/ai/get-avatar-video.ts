import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiGetAvatarVideo = createAction({
  auth: joggAiAuth,
  name: 'ai_get_avatar_video',
  displayName: 'Get Avatar Video',
  description: 'Gets the status and URL of an avatar video.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: joggAiOutputSchemas.aiGetAvatarVideo,
  aiMetadata: {
    description:
      'Gets the render status of a talking-avatar video started with Create Avatar Video, by its video_id. Status is pending, processing, completed or failed; video_url and cover_url are set once it is completed. Rendering usually takes a few minutes, so poll sparingly. Read-only.',
    idempotent: true,
  },
  props: {
    video_id: Property.ShortText({
      displayName: 'Video ID',
      description: 'The video_id returned by Create Avatar Video.',
      required: true,
    }),
  },
  async run(context) {
    const videoId = context.propsValue.video_id.trim();
    if (!videoId) {
      throw new Error('Video ID is required.');
    }
    return joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/avatar_video/${encodeURIComponent(videoId)}`,
      op: 'get avatar video',
    });
  },
});
