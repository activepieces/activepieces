
    import { createPiece } from "@activepieces/pieces-framework";
    import { PieceCategory } from "@activepieces/shared";
    import { uploadVideo } from "./lib/actions/upload-video";
    import { deleteVideo } from "./lib/actions/delete-video";
    import { addVideoToAlbum } from "./lib/actions/add-video-to-album";
    import { newVideoBySearch } from "./lib/triggers/new-video-by-search";
    import { newVideoByUser } from "./lib/triggers/new-video-by-user";
    import { newVideoIHaveLiked } from "./lib/triggers/new-video-i-have-liked";
    import { newVideoOfMine } from "./lib/triggers/new-video-of-mine";
    import { vimeoAuth } from "./lib/common";

    export const vimeo = createPiece({
      displayName: "Vimeo",
      auth: vimeoAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/vimeo.png",
      authors: ["activepieces"],
      categories: [PieceCategory.CONTENT_AND_FILES],
      actions: [uploadVideo, deleteVideo, addVideoToAlbum],
      triggers: [newVideoBySearch, newVideoByUser, newVideoIHaveLiked, newVideoOfMine],
    });
    