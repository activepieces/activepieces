
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { vimeoAuth } from './lib/common/auth';
import { uploadVideo } from './lib/actions/upload-video';
import { addVideoToAlbum } from './lib/actions/add-video-to-album';
import { deleteVideo } from './lib/actions/delete-video';
import { newLikedVideo } from './lib/triggers/new-liked-video';
import { newVideoBySearch } from './lib/triggers/new-video-by-search';
import { newMyVideo } from './lib/triggers/new-my-video';
import { newUserVideo } from './lib/triggers/new-user-video';

export const vimeo = createPiece({
    displayName: 'Vimeo',
    description: 'Video hosting and distribution platform with powerful privacy, collaboration, and embedding controls',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/vimeo.png',
    categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.MARKETING],
    authors: ['activepieces'],
    auth: vimeoAuth,
    actions: [
        uploadVideo,
        addVideoToAlbum,
        deleteVideo,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.vimeo.com',
            auth: vimeoAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${(auth as any).access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.vimeo.*+json;version=3.4'
            }),
        }),
    ],
    triggers: [
        newLikedVideo,
        newVideoBySearch,
        newMyVideo,
        newUserVideo
    ],
});