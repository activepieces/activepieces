import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { getProductById } from './lib/actions/Product/get-product-by-id';
import { createProduct } from './lib/actions/Product/create-product';
import { updateProduct } from './lib/actions/Product/update-product';
import { getBrandList } from './lib/actions/Brand/get-brand-list';
import { getBrandById } from './lib/actions/Brand/get-brand-by-id';
import { createBrand } from './lib/actions/Brand/create-brand';
import { updateBrand } from './lib/actions/Brand/update-brand';
import { deleteBrand } from './lib/actions/Brand/delete-brand';
import { getCategoryById } from './lib/actions/Category/get-category-by-id';
import { getSkuByProductId } from './lib/actions/SKU/get-sku-by-product-id';
import { createSku } from './lib/actions/SKU/create-sku';
import { createSkuFile } from './lib/actions/SKU-File/create-sku-file';
import { getClientList } from './lib/actions/Client/get-client-list';
import { getClientById } from './lib/actions/Client/get-client-by-id';
import { getOrderById } from './lib/actions/Order/get-order-by-id';
import { getOrderList } from './lib/actions/Order/get-order-list';

const markdownDescription = `
**Host Url**: The VTEX store host (e.g \`{{accountName}}.{{environment}}.com\`)
**App Key** and **App Token**: To get your app key and app token, follow the steps below:
1. Go to your vtex account on **Account Settings** -> **Account** -> **Security**
2. Click on **Generate access key and secret**
4. Copy the access key as your **App Key** and the secret is your **App Token**.
`;

export const vtexAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    hostUrl: Property.ShortText({
      displayName: 'Host Url',
      description: '{accountName}.{environment}.com',
      required: true,
    }),
    appKey: PieceAuth.SecretText({
      displayName: 'App Key',
      description: 'VTEX App Key',
      required: true,
    }),
    appToken: PieceAuth.SecretText({
      displayName: 'App Token',
      description: 'VTEX App Token',
      required: true,
    }),
  },
  required: true,
});

export const vtex = createPiece({
  displayName: 'VTEX',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/vtex.png',
  authors: ['Willianwg'],
  auth: vtexAuth,
  actions: [
    getProductById,
    createProduct,
    updateProduct,
    getBrandList,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
    getCategoryById,
    getSkuByProductId,
    createSku,
    createSkuFile,
    getClientList,
    getClientById,
    getOrderById,
    getOrderList,
  ],
  triggers: [],
});
