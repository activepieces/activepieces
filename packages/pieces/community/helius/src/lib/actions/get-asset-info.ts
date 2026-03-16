import { createAction, Property } from '@activepieces/pieces-framework';
import { heliusAuth } from '../..';
import { heliusRpcRequest } from '../common/helius-api';

interface AssetResponse {
  id: string;
  content: {
    json_uri: string;
    metadata: {
      name: string;
      symbol: string;
      description: string;
    };
    links: {
      image: string;
      external_url: string;
    };
  };
  authorities: { address: string; scopes: string[] }[];
  compression: {
    compressed: boolean;
  };
  grouping: { group_key: string; group_value: string }[];
  royalty: {
    royalty_model: string;
    percent: number;
  };
  ownership: {
    owner: string;
    frozen: boolean;
    delegated: boolean;
  };
  interface: string;
}

export const getAssetInfo = createAction({
  name: 'get_asset_info',
  displayName: 'Get Asset Info',
  description:
    'Get detailed information about a Solana NFT or token by its mint address.',
  auth: heliusAuth,
  requireAuth: true,
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID (Mint Address)',
      description: 'The mint address of the Solana asset to look up.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const data = await heliusRpcRequest<AssetResponse>(
      auth as string,
      'getAsset',
      { id: propsValue.asset_id }
    );

    return data;
  },
});
