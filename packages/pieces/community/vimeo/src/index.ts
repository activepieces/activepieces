import { createPiece, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { vimeoAuth } from "./lib/auth";
import { uploadVideo } from './lib/actions/upload-video';
import { deleteVideo } from './lib/actions/delete-video';
import { addVideoToShowcase } from './lib/actions/add-video-to-showcase';
import { addVideoToFolder } from './lib/actions/add-video-to-folder';
import { newVideoLiked } from './lib/triggers/new-video-liked';
import { newVideoBySearch } from './lib/triggers/new-video-by-search';
import { newVideoOfMine } from './lib/triggers/new-video-of-mine';
import { newVideoByUser } from './lib/triggers/new-video-by-user';
import { PieceCategory } from "@activepieces/shared";
import { createCustomApiCallAction } from "@activepieces/pieces-common";

export const vimeo = createPiece({
  displayName: "Vimeo",
  auth: vimeoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/vimeo.png",
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['stefansarya'],
  actions: [
    uploadVideo,
    deleteVideo,
    addVideoToShowcase,
    addVideoToFolder,
    createCustomApiCallAction({
      auth: vimeoAuth,
      baseUrl: () => "https://api.vimeo.com",
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [
    newVideoLiked,
    newVideoBySearch,
    newVideoOfMine,
    newVideoByUser
  ],
});