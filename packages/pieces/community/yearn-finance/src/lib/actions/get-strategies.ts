import { createAction, Property } from '@activepieces/pieces-framework';
import { CHAIN_OPTIONS, yearnApi } from '../common/yearn-api';

export const getStrategiesAction = createAction({
  name: 'get_strategies',
  displayName: 'Get Vault Strategies',
  description: 'Retrieve all strategies used by a specific Yearn vault, including protocol allocation, risk, and APY contribution.',
  props: {
    chainId: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network the vault is on.',
      required: true,
      defaultValue: '1',
      options: {
        options: Object.entries(CHAIN_OPTIONS).map(([value, label]) => ({ value, label })),
      },
    }),
    vaultAddress: Property.ShortText({
      displayName: 'Vault Address',
      description: 'The contract address of the Yearn vault.',
      required: true,
    }),
  },
  async run(context) {
    const { chainId, vaultAddress } = context.propsValue;
    return await yearnApi.getStrategies(chainId as string, vaultAddress as string);
  },
});
