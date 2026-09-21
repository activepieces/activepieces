import { createAction } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { youtubeDownloadCaptionAction } from './download-caption';

export const youtubeDownloadCaptionTrackAction = createAction({
  auth: youtubeAuth,
  name: 'download_caption_track',
  classification: 'READ',
  displayName: 'Download Caption Track',
  description:
    'Returns a caption track text by caption ID using the YouTube captions.download endpoint. Requires permission to edit the video, so it only works for captions on videos the authenticated user owns. Auto-generated (asr) caption tracks cannot be downloaded and will return a 403.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Downloads the raw text of one caption track by caption ID, optionally as SRT, VTT, SBV, SCC or TTML and machine-translated into a target language. Use it after List Caption Tracks supplies the caption ID. It only serves tracks on videos the connected account can edit, and auto-generated (asr) tracks are refused with a 403. Read-only and idempotent.',
    idempotent: true,
  },
  props: youtubeDownloadCaptionAction.props,
  run: youtubeDownloadCaptionAction.run,
});
