import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { convertFileAction } from './lib/actions/convert-file';
import { mergePdfAction } from './lib/actions/merge-pdf';
import { splitPdfAction } from './lib/actions/split-pdf';
import { convertApiAuth } from './lib/auth';
import { CONVERTAPI_BASE_URL } from './lib/common/client';

export const convertapi = createPiece({
    displayName: 'ConvertAPI',
    description: 'Convert, merge and split documents, images and PDFs with 300+ file converters.',
    minimumSupportedRelease: '0.82.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/convertapi.png',
    categories: [PieceCategory.CONTENT_AND_FILES],
    auth: convertApiAuth,
    authors: ['OdaiAhmed99'],
    actions: [
        mergePdfAction,
        splitPdfAction,
        convertFileAction,
        createCustomApiCallAction({
            baseUrl: () => CONVERTAPI_BASE_URL,
            auth: convertApiAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [],
});
