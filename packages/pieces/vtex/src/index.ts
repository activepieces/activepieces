
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { getProductById } from "./lib/actions/get-product-by-id";
import { createProduct } from "./lib/actions/create-product";

export const vtex = createPiece({
  name: "vtex",
  displayName: "VTEX",
  logoUrl: "https://cdn.activepieces.com/pieces/vtex.png",
  version: packageJson.version,
  authors: ["Willianwg"],
  actions: [getProductById, createProduct],
  triggers: [],
});
