import { AuthenticationType, createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { convertFileToUrl } from './lib/actions/convert-file-to-url'
import { createImage } from './lib/actions/create-image'
import { createPdf } from './lib/actions/create-pdf'
import { createVideo } from './lib/actions/create-video'
import { getImage } from './lib/actions/get-image'
import { getPdf } from './lib/actions/get-pdf'
import { getVideo } from './lib/actions/get-video'
import { placidAuth } from './lib/auth'
import { PLACID_BASE_URL } from './lib/common'

export const placid = createPiece({
    displayName: 'Placid',
    description: 'Creative automation engine that generates dynamic images, PDFs, and videos from templates and data.',
    minimumSupportedRelease: '0.30.0',
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
})
