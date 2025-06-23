import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createDesignAction } from './lib/actions/create-design';
import { exportDesignAction } from './lib/actions/export-design';
import { findDesignAction } from './lib/actions/find-design';
import { getFolderAction } from './lib/actions/get-a-folder';
import { getImageAction } from './lib/actions/get-an-image';
import { importDesignAction } from './lib/actions/import-design';
import { moveFolderItemAction } from './lib/actions/move-folder-item';
import { uploadAssetAction } from './lib/actions/upload-asset';
import { canvaAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';

export const canva = createPiece({
    displayName: 'Canva',
    logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
    auth: canvaAuth,
    categories: [PieceCategory.PRODUCTIVITY],
    minimumSupportedRelease: '0.36.1',
    authors: ['aryel780'],
    actions: [
        createDesignAction,
        exportDesignAction,
        findDesignAction,
        getFolderAction,
        getImageAction,
        importDesignAction,
        moveFolderItemAction,
        uploadAssetAction,
        createCustomApiCallAction({
            auth: canvaAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${(auth as { access_token: string }).access_token}`,
                };
            },
        }),
    ],
    triggers: [],
});
