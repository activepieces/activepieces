import { Property, createAction } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../../index';
import { vimeoRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const vimeoDeleteVideo = createAction({
  auth: vimeoAuth,
  name: 'vimeo_delete_video',
  displayName: 'Delete Video',
  description: 'Delete a video by ID.',
  props: {
    video_id: Property.ShortText({ displayName: 'Video ID or URI', required: true }),
  },
  async run({ auth, propsValue }) {
    const token = auth as string;
    let id = (propsValue.video_id as string).trim();
    if (id.startsWith('/videos/')) id = id.replace('/videos/', '');
    const res = await vimeoRequest<any>(token, HttpMethod.DELETE, `/videos/${encodeURIComponent(id)}`);
    return res.body ?? { success: true };
  },
});

