
    import { createPiece } from "@activepieces/pieces-framework";
    import { createIndex } from "./lib/actions/create-index";
    import { searchIndex } from "./lib/actions/search-index";
    import { upsertVector } from "./lib/actions/upsert-vector";
    import { getAVector } from "./lib/actions/get-a-vector";
    import { updateAVector } from "./lib/actions/update-a-vector";
    import { deleteAVector } from "./lib/actions/delete-a-vector";
    import { searchVectors } from "./lib/actions/search-vectors";
    import { pineconeAuth } from "./lib/common/auth";

    // Export common utilities directly
    export { pineconeAuth, PineconeAuth } from "./lib/common/auth";
    export { PineconeClient } from "./lib/common/client";
    export { commonProps, vectorProps, searchProps } from "./lib/common/props";

    export const pinecone = createPiece({
      displayName: "Pinecone",
      auth: pineconeAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/pinecone.png",
      authors: [],
      actions: [createIndex, searchIndex, upsertVector, getAVector, updateAVector, deleteAVector, searchVectors],
      triggers: [],
    });
    