import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createBrand } from './lib/actions/Brand/create-brand';
import { deleteBrand } from './lib/actions/Brand/delete-brand';
import { getBrandById } from './lib/actions/Brand/get-brand-by-id';
import { getBrandList } from './lib/actions/Brand/get-brand-list';
import { updateBrand } from './lib/actions/Brand/update-brand';
import { getCategoryById } from './lib/actions/Category/get-category-by-id';
import { getClientById } from './lib/actions/Client/get-client-by-id';
import { getClientList } from './lib/actions/Client/get-client-list';
import { getOrderById } from './lib/actions/Order/get-order-by-id';
import { getOrderList } from './lib/actions/Order/get-order-list';
import { createProduct } from './lib/actions/Product/create-product';
import { getProductById } from './lib/actions/Product/get-product-by-id';
import { updateProduct } from './lib/actions/Product/update-product';
import { createSkuFile } from './lib/actions/SKU-File/create-sku-file';
import { createSku } from './lib/actions/SKU/create-sku';
import { getSkuByProductId } from './lib/actions/SKU/get-sku-by-product-id';

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
  description: 'Unified commerce platform',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/vtex.png',
  categories: [PieceCategory.COMMERCE],
  authors: ["Willianwg","kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
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
    createCustomApiCallAction({
      baseUrl: (auth) => `https://${(auth as { hostUrl: string }).hostUrl}`,
      auth: vtexAuth,
      authMapping: async (auth) => ({
        'X-VTEX-API-AppKey': (auth as { appKey: string }).appKey,
        'X-VTEX-API-AppToken': (auth as { appToken: string }).appToken,
      }),
    }),
  ],
  triggers: [],
});
