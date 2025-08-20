
    import { createPiece } from "@activepieces/pieces-framework";
    import { createIndex } from "./lib/actions/create-index";
    import { searchIndex } from "./lib/actions/search-index";
    import { upsertVector } from "./lib/actions/upsert-vector";
    import { getAVector } from "./lib/actions/get-a-vector";
    import { updateAVector } from "./lib/actions/update-a-vector";
    import { deleteAVector } from "./lib/actions/delete-a-vector";
    import { searchVectors } from "./lib/actions/search-vectors";
    import { pineconeAuth } from "./lib/common";

    export { pineconeAuth } from "./lib/common";

    export const pinecone = createPiece({
      displayName: "Pinecone",
      auth: pineconeAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/pinecone.png",
      authors: [],
      actions: [createIndex, searchIndex, upsertVector, getAVector, updateAVector, deleteAVector, searchVectors],
      triggers: [],
    });
    