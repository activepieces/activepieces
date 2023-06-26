
import { createPiece } from "@activepieces/pieces-framework";
import { getProductById } from "./lib/actions/Product/get-product-by-id";
import { createProduct } from "./lib/actions/Product/create-product";
import { updateProduct } from "./lib/actions/Product/update-product";
import { getBrandList } from "./lib/actions/Brand/get-brand-list";
import { getBrandById } from "./lib/actions/Brand/get-brand-by-id";
import { createBrand } from "./lib/actions/Brand/create-brand";
import { updateBrand } from "./lib/actions/Brand/update-brand";
import { deleteBrand } from "./lib/actions/Brand/delete-brand";
import { getCategoryById } from "./lib/actions/Category/get-category-by-id";
import { getSkuByProductId } from "./lib/actions/SKU/get-sku-by-product-id";
import { createSku } from "./lib/actions/SKU/create-sku";
import { createSkuFile } from "./lib/actions/SKU-File/create-sku-file";
import { getClientList } from "./lib/actions/Client/get-client-list";
import { getClientById } from "./lib/actions/Client/get-client-by-id";
import { getOrderById } from "./lib/actions/Order/get-order-by-id";
import { getOrderList } from "./lib/actions/Order/get-order-list";

export const vtex = createPiece({
  displayName: "VTEX",
  logoUrl: "https://cdn.activepieces.com/pieces/vtex.png",
  authors: ["Willianwg"],
  actions: [
    getProductById, createProduct, updateProduct, getBrandList, getBrandById, createBrand, updateBrand, deleteBrand,
    getCategoryById, getSkuByProductId, createSku, createSkuFile, getClientList, getClientById, getOrderById, getOrderList
  ],
  triggers: [],
});
