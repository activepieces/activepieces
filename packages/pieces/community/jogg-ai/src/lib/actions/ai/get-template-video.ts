import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiGetTemplateVideo = createAction({
  auth: joggAiAuth,
  name: 'ai_get_template_video',
  displayName: 'Get Template Video',
  description: 'Gets the status and URL of a template video.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: joggAiOutputSchemas.aiGetTemplateVideo,
  aiMetadata: {
    description:
      'Gets the render status of a video started with Create Template Video, by its video_id. Status is pending, processing, completed or failed; data.url, cover, duration and credits used are set once it is completed. Read-only.',
    idempotent: true,
  },
  props: {
    video_id: Property.ShortText({
      displayName: 'Video ID',
      description: 'The video_id returned by Create Template Video.',
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
      path: `/v2/template_video/${encodeURIComponent(videoId)}`,
      op: 'get template video',
    });
  },
});
