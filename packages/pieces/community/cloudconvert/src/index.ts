import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { cloudconvertAuth } from './lib/common/auth';
import { convertFileAction } from './lib/actions/convert-file';
import { captureWebsiteAction } from './lib/actions/capture-website';
import { downloadFileAction } from './lib/actions/download-file';
import { cloudconvertNewJobEvent } from './lib/triggers/new-job-event';
import { cloudconvertJobFinished } from './lib/triggers/job-finished';
import { cloudconvertJobFailed } from './lib/triggers/job-failed';

export const cloudconvert = createPiece({
  displayName: 'CloudConvert',
  description: 'Convert files and capture websites using CloudConvert API v2.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cloudconvert.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['Ripasco'],
  auth: cloudconvertAuth,
  actions: [convertFileAction, captureWebsiteAction, downloadFileAction],
  triggers: [cloudconvertNewJobEvent, cloudconvertJobFinished, cloudconvertJobFailed],
});
