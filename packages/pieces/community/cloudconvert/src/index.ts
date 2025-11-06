
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { cloudconvertAuth } from './lib/common/auth';
import { newJob } from './lib/triggers/new-job';
import { jobFinished } from './lib/triggers/job-finished';
import { jobFailed } from './lib/triggers/job-failed';
import { convertFile } from './lib/actions/convert-file';
import { captureWebsite } from './lib/actions/capture-website';
import { mergePdf } from './lib/actions/merge-pdf';
import { downloadFile } from './lib/actions/download-file';
import { archiveFile } from './lib/actions/archive-file';
import { optimizeFile } from './lib/actions/optimize-file';

export const cloudconvert = createPiece({
    displayName: 'CloudConvert',
    description: 'File conversion and processing platform supporting 200+ formats',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/cloudconvert.png',
    categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.CONTENT_AND_FILES],
    authors: ['owuzo'],
    auth: cloudconvertAuth,
    actions: [
        convertFile,
        captureWebsite,
        mergePdf,
        downloadFile,
        archiveFile,
        optimizeFile,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.cloudconvert.com/v2',
            auth: cloudconvertAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth}`,
            }),
        }),
    ],
    triggers: [newJob, jobFinished, jobFailed],
});
    