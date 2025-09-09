
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { jobFinished } from './lib/triggers/job-finished.trigger';
    import { newJobEvent } from './lib/triggers/new-job-event';
    import { jobFailed } from './lib/triggers/job-failed';
    import { convertFile } from './lib/actions/convert-file';
    import { captureWebsite } from './lib/actions/capture-website';
    import { mergeFiles } from './lib/actions/merge-files';
    import { downloadFile } from './lib/actions/download-file';
    import { archiveFiles } from './lib/actions/archive-files';
    import { optimizeFile } from './lib/actions/optimize-file';

    export const cloudconvert = createPiece({
      displayName: 'Cloudconvert',
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/cloudconvert.png',
      authors: ['Prabhukiran161'],
      actions: [
        convertFile,
        captureWebsite,
        mergeFiles,
        downloadFile,
        archiveFiles,
        optimizeFile,
      ],
      triggers: [jobFinished, newJobEvent, jobFailed],
    });
    