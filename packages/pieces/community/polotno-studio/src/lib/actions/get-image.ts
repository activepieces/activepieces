import { Property, createAction } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from '../auth';
import { createClient } from '../common/client';
import type { RenderLike } from '../common/types';

export const getImage = createAction({
  auth: polotnoStudioAuth,
  name: 'get_image',
  displayName: 'Get Image',
  description: 'Look up an image render by its id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the current state of a single image render by its id (img_...), including its status and, once complete, its download URL. Choose this to check on a render started earlier without waiting. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    render_id: Property.ShortText({
      displayName: 'Image Render ID',
      description: 'The id returned by Render Image, starting with img_.',
      required: true,
    }),
  },
  async run(context) {
    const client = createClient(context.auth.secret_text);
    return client.request<RenderLike>({
      path: `/v1/images/${encodeURIComponent(context.propsValue.render_id)}`,
    });
  },
});
