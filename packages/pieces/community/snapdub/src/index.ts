import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createClipsAction } from './lib/actions/create-clips';
import { getVideoAction } from './lib/actions/get-video';
import { listClipsAction } from './lib/actions/list-clips';
import { schedulePostAction } from './lib/actions/schedule-post';
import { snapdubAuth } from './lib/auth';
import { SNAPDUB_BASE_URL } from './lib/common/client';
import { clipsReadyTrigger } from './lib/triggers/clips-ready';
import { videoFailedTrigger } from './lib/triggers/video-failed';

export const snapdub = createPiece({
  displayName: 'SnapDub',
  description:
    'AI video clipper: turn long videos into short vertical clips with captions and post them to TikTok, YouTube and Instagram.',
  auth: snapdubAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/snapdub.png',
  authors: ['aheront'],
  categories: [
    PieceCategory.CONTENT_AND_FILES,
    PieceCategory.MARKETING,
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
  ],
  actions: [
    createClipsAction,
    getVideoAction,
    listClipsAction,
    schedulePostAction,
    createCustomApiCallAction({
      auth: snapdubAuth,
      baseUrl: () => SNAPDUB_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [clipsReadyTrigger, videoFailedTrigger],
});
