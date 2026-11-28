import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { snapdubAuth } from '../auth';
import { snapdubClient, SnapDubVideoWithClips } from '../common/client';
import { snapdubProps } from '../common/props';

export const listClipsAction = createAction({
  auth: snapdubAuth,
  name: 'list_clips',
  classification: 'SEARCH',
  displayName: 'List Clips',
  description:
    'Lists the clips of a finished video, best first, each with a download link that works for one hour.',
  audience: 'both',
  aiMetadata: {
    description:
      "List a finished SnapDub video's clips, best first: clip_id, title, virality score (0-100), description, hashtags, length, download and thumbnail links. Download links expire after an hour, so fetch the file soon after. Returns an empty clips list with a note if the video is not done yet. Safe to retry.",
    idempotent: true,
  },
  props: {
    video_id: snapdubProps.videoIdProp,
  },
  async run(context) {
    return await snapdubClient.call<SnapDubVideoWithClips>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/videos/${encodeURIComponent(
        context.propsValue.video_id.trim()
      )}/clips`,
    });
  },
});
