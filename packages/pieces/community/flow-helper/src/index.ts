
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getRunId } from "./lib/actions/get-run-id";

    export const flowHelper = createPiece({
      displayName: "Flow-helper",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/flow-helper.svg",
      authors: [],
      actions: [getRunId],
      triggers: [],
    });
    