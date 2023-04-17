
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { getProductById } from "./lib/actions/Product/get-product-by-id";
import { createProduct } from "./lib/actions/Product/create-product";
import { updateProduct } from "./lib/actions/Product/update-product";
import { getBrandList } from "./lib/actions/Brand/get-brand-list";
import { getBrandById } from "./lib/actions/Brand/get-brand-by-id";
import { createBrand } from "./lib/actions/Brand/create-brand";
import { updateBrand } from "./lib/actions/Brand/update-brand";
import { deleteBrand } from "./lib/actions/Brand/delete-brand";
import { getCategoryById } from "./lib/actions/Category/get-category-by-id";

export const vtex = createPiece({
  name: "vtex",
  displayName: "VTEX",
  logoUrl: "https://cdn.activepieces.com/pieces/vtex.png",
  version: packageJson.version,
  authors: ["Willianwg"],
  actions: [getProductById, createProduct, updateProduct, getBrandList, getBrandById, createBrand, updateBrand, deleteBrand, getCategoryById],
  triggers: [],
});
