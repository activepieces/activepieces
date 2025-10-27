import { createPiece } from "@activepieces/pieces-framework";
import { shippoAuth } from "./lib/common/auth";
import { createOrder } from "./lib/actions/create-order";
import { findOrder } from "./lib/actions/find-order";
import { findShippingLabel } from "./lib/actions/find-shipping-label";
import { newShippingLabel } from "./lib/triggers/new-shipping-label";
import { newOrder } from "./lib/triggers/new-order";
import { PieceCategory } from "@activepieces/shared";

export const shippo = createPiece({
    displayName: "Shippo",
    auth: shippoAuth,
    description: "Shippo is a multi-carrier shipping platform and API that helps businesses get real-time shipping rates, print labels, automate international paperwork, track packages, and manage returns — all in one place.",
    categories: [PieceCategory.SALES_AND_CRM, PieceCategory.PRODUCTIVITY],
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/shippo.png",
    authors: ["sw"],
    actions: [
        createOrder,
        findOrder,
        findShippingLabel,
    ],
    triggers: [
        newShippingLabel,
        newOrder,
    ],
});
