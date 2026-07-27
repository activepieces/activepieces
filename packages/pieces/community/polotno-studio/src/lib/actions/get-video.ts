import { Property, createAction } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from '../auth';
import { createClient } from '../common/client';
import type { RenderLike } from '../common/types';

export const getVideo = createAction({
  auth: polotnoStudioAuth,
  name: 'get_video',
  displayName: 'Get Video',
  description: 'Look up a video render by its id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the current state of a single video render by its id (vid_...), including its status and, once complete, its download URL and thumbnail. Choose this to check on a render started earlier without waiting. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    render_id: Property.ShortText({
      displayName: 'Video Render ID',
      description: 'The id returned by Render Video, starting with vid_.',
      required: true,
    }),
  },
  async run(context) {
    const client = createClient(context.auth.secret_text);
    return client.request<RenderLike>({
      path: `/v1/videos/${encodeURIComponent(context.propsValue.render_id)}`,
    });
  },
});
