import { Property, createAction } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../../index';
import { vimeoRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const vimeoAddToAlbum = createAction({
  auth: vimeoAuth,
  name: 'vimeo_add_to_album',
  displayName: 'Add Video to Album',
  description: 'Add an existing video to an album.',
  props: {
    album_id: Property.ShortText({ displayName: 'Album ID or URI', required: true }),
    video_id: Property.ShortText({ displayName: 'Video ID or URI', required: true }),
  },
  async run({ auth, propsValue }) {
    const token = auth as string;
    let album = (propsValue.album_id as string).trim();
    let video = (propsValue.video_id as string).trim();
    if (album.startsWith('/albums/')) album = album.replace('/albums/', '');
    if (video.startsWith('/videos/')) video = video.replace('/videos/', '');
    const res = await vimeoRequest<any>(token, HttpMethod.PUT, `/me/albums/${encodeURIComponent(album)}/videos/${encodeURIComponent(video)}`);
    return res.body ?? { success: true };
  },
});

