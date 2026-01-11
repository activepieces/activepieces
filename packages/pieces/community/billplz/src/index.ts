
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { billplzAuth } from "./lib/common/auth";
import { createBill } from "./lib/actions/create-bill";
import { getBill } from "./lib/actions/get-bill";
import { getCollectionsTrigger } from "./lib/triggers/get-collections.trigger";

    export const billplz = createPiece({
      displayName: "Billplz",
      description: "Create and manage bills and collections with Billplz API",
      auth: billplzAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/billplz.png",
      authors: ['onyedikachi-david'],
      actions: [createBill, getBill],
      triggers: [getCollectionsTrigger],
    });
    