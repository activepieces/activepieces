import { createAction, Property } from '@activepieces/pieces-framework';
import { CHAIN_OPTIONS, yearnApi } from '../common/yearn-api';

export const getVaultsAction = createAction({
  name: 'get_vaults',
  displayName: 'Get Vaults',
  description: 'List active Yearn Finance vaults for a given chain with APY and TVL data.',
  props: {
    chainId: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query vaults for.',
      required: true,
      defaultValue: '1',
      options: {
        options: Object.entries(CHAIN_OPTIONS).map(([value, label]) => ({ value, label })),
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of vaults to return.',
      required: false,
      defaultValue: 20,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of vaults to skip (for pagination).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { chainId, limit, skip } = context.propsValue;
    return await yearnApi.getVaults(
      chainId as string,
      (limit as number) ?? 20,
      (skip as number) ?? 0,
    );
  },
});
