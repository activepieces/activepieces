import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroExRequest, CHAIN_OPTIONS } from '../0x-api';
import { zeroExAuth } from '../../index';

export const getSources = createAction({
  name: 'get_sources',
  displayName: 'Get Liquidity Sources',
  description: 'List all liquidity sources (DEXes) that 0x aggregates on a given chain.',
  auth: zeroExAuth,
  props: {
    chainId: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query.',
      required: true,
      options: {
        options: CHAIN_OPTIONS,
      },
    }),
  },
  async run(context) {
    const { chainId } = context.propsValue;
    return zeroExRequest(
      context.auth as string,
      chainId,
      '/swap/v1/sources',
      {}
    );
  },
});
