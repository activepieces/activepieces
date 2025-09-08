import { createPiece } from '@activepieces/pieces-framework';

import { cloudConvertAuth } from './lib/auth';

import { convertFile } from './lib/actions/convert-a-file';
import { captureWebsite } from './lib/actions/capture-a-website';
import { mergeFilesToPdf } from './lib/actions/merge-files-to-pdf';
import { archiveFile } from './lib/actions/archive-file';
import { optimizeFile } from './lib/actions/optimize-file';
import { downloadFile } from './lib/actions/download-a-file';

import { jobCreated } from './lib/triggers/new-job-event';
import { jobFinished } from './lib/triggers/job-finished';
import { jobFailed } from './lib/triggers/job-failed';

export const cloudconvert = createPiece({
  displayName: 'CloudConvert',
  description: 'Convert, optimize, capture websites, and process files via CloudConvert API v2.',
  logoUrl: 'https://cdn.activepieces.com/pieces/cloudconvert.png',
  authors: ['sudarshan-magar7'],
  auth: cloudConvertAuth,
  minimumSupportedRelease: '0.36.1',
  actions: [
    convertFile,
    captureWebsite,
    mergeFilesToPdf,
    archiveFile,
    optimizeFile,
    downloadFile,
  ],
  triggers: [jobCreated, jobFinished, jobFailed],
});