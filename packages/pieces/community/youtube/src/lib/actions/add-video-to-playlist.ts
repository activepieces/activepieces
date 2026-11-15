import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { addVideoToPlaylistOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeAddVideoToPlaylistAction = createAction({
  auth: youtubeAuth,
  outputSchema: addVideoToPlaylistOutputSchema,
  name: 'add_video_to_playlist',
  classification: 'WRITE',
  displayName: 'Add Video To Playlist',
  description: 'Add a video to a playlist owned by the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one video to a playlist owned by the authenticated channel via playlistItems.insert and returns the new playlist item, whose ID is what Remove Video From Playlist needs. Use Create Playlist first when the playlist does not exist yet. YouTube allows the same video more than once, so retries add duplicate entries.',
    idempotent: false,
  },
  props: {
    playlistId: Property.ShortText({
      displayName: 'Playlist ID',
      description:
        'The playlist to add to. This is the `list` parameter in a playlist URL.',
      required: true,
    }),
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'The `v` parameter in a YouTube URL (e.g. `dQw4w9WgXcQ`).',
      required: true,
    }),
    position: Property.Number({
      displayName: 'Position',
      description:
        'Zero-based position in the playlist. Leave blank to append to the end.',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { playlistId, videoId, position } = context.propsValue;

    const snippet: PlaylistItemSnippetPayload = {
      playlistId,
      resourceId: { kind: 'youtube#video', videoId },
    };

    if (position !== undefined && position !== null) {
      const positionNumber = Math.trunc(Number(position));
      if (!Number.isFinite(positionNumber) || positionNumber < 0) {
        throw new Error('Position must be zero or greater.');
      }
      snippet.position = positionNumber;
    }

    return youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.POST,
      path: '/playlistItems',
      operation: 'Add Video To Playlist',
      queryParams: { part: 'snippet' },
      body: { snippet },
    });
  },
});

type PlaylistItemSnippetPayload = {
  playlistId: string;
  resourceId: { kind: string; videoId: string };
  position?: number;
};
