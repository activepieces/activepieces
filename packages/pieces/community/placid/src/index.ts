import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createImage } from './lib/actions/create-image';
import { createPdf } from './lib/actions/create-pdf';
import { createVideo } from './lib/actions/create-video';
import { convertFileToUrl } from './lib/actions/convert-file-to-url';
import { getImage } from './lib/actions/get-image';
import { getPdf } from './lib/actions/get-pdf';
import { getVideo } from './lib/actions/get-video';
import { listTemplatesAi } from './lib/actions/list-templates-ai';
import { getTemplateAi } from './lib/actions/get-template-ai';
import { listCollectionsAi } from './lib/actions/list-collections-ai';
import { createImageAi } from './lib/actions/create-image-ai';
import { createPdfAi } from './lib/actions/create-pdf-ai';
import { createVideoAi } from './lib/actions/create-video-ai';
import { deleteImageAi } from './lib/actions/delete-image-ai';
import { deletePdfAi } from './lib/actions/delete-pdf-ai';
import { deleteVideoAi } from './lib/actions/delete-video-ai';
import { PLACID_BASE_URL } from './lib/common';
import { placidAuth } from './lib/auth';

export const placid = createPiece({
	displayName: 'Placid',
	description:
		'Creative automation engine that generates dynamic images, PDFs, and videos from templates and data.',
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/placid.png',
	categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.MARKETING],
	auth: placidAuth,
	actions: [
		createImage,
		createPdf,
		createVideo,
		convertFileToUrl,
		getImage,
		getPdf,
		getVideo,
		listTemplatesAi,
		getTemplateAi,
		listCollectionsAi,
		createImageAi,
		createPdfAi,
		createVideoAi,
		deleteImageAi,
		deletePdfAi,
		deleteVideoAi,
		createCustomApiCallAction({
			auth: placidAuth,
			baseUrl: () => PLACID_BASE_URL,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${auth.secret_text}`,
			}),
		}),
	],
	triggers: [],
	authors: ['MAVRICK-1'],
});
