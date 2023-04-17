
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { getProductById } from "./lib/actions/get-product-by-id";
import { createProduct } from "./lib/actions/create-product";
import { updateProduct } from "./lib/actions/update-product";
import { getBrandList } from "./lib/actions/get-brand-list";
import { getBrandById } from "./lib/actions/get-brand-by-id";

export const vtex = createPiece({
  name: "vtex",
  displayName: "VTEX",
  logoUrl: "https://cdn.activepieces.com/pieces/vtex.png",
  version: packageJson.version,
  authors: ["Willianwg"],
  actions: [getProductById, createProduct, updateProduct, getBrandList, getBrandById],
  triggers: [],
});
