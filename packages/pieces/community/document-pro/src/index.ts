import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { documentProAuth } from './lib/common/auth';
import { uploadDocument } from './lib/actions/upload-document';
import { runExtract } from './lib/actions/run-extract';
import { pollExtract } from './lib/actions/poll-extract';
import { deleteJob } from './lib/actions/delete-job';
import { newDocument } from './lib/triggers/new-document';

export const documentPro = createPiece({
	displayName: 'DocumentPro',
	auth: documentProAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/document-pro.png',
	description: 'Extract structured data from documents using AI-powered parsing.',
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.CONTENT_AND_FILES],
	authors: ["onyedikachi-david"],
	actions: [uploadDocument, runExtract, pollExtract, deleteJob],
	triggers: [newDocument],
});
