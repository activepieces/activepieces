    import { createPiece } from "@activepieces/pieces-framework";
import { auth } from "./common";
import { test } from "./lib/actions/test";

    export const pipefy = createPiece({
      displayName: "Pipefy",
      auth: auth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/pipefy.png",
      authors: [],
      actions: [test],
      triggers: [],
    });
    