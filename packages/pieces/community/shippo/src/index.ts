
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createOrder } from "./lib/actions/create-order";
import { findShippingLabel } from "./lib/actions/find-a-shipping-label";
import { findOrder } from "./lib/actions/find-an-order";
import { ShippoAuth } from "./lib/common/auth";
import { newOrder } from "./lib/triggers/new-order";
import { newShippingLabel } from "./lib/triggers/new-shipping-label";

export const shippo = createPiece({
  displayName: "Shippo",
  auth: ShippoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/shippo.png",
  authors: ["omey12"],
  actions: [createOrder, findOrder, findShippingLabel],
  triggers: [newOrder,newShippingLabel],
});
