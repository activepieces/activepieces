import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchPairs } from '../raydium-api';

export const getPairInfo = createAction({
  name: 'get-pair-info',
  displayName: 'Get Pair Info',
  description: 'Retrieve detailed information for a specific Raydium trading pair by AMM ID or pair name.',
  auth: undefined,
  props: {
    pairId: Property.ShortText({
      displayName: 'AMM ID or Pair Name',
      description: 'The AMM pool ID (e.g. 58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWaS) or pair name (e.g. RAY-USDC).',
      required: true,
    }),
  },
  async run(context) {
    const { pairId } = context.propsValue;
    const pairs = await fetchPairs();

    const match = pairs.find(
      (p) =>
        p.ammId === pairId ||
        p.name?.toLowerCase() === pairId.toLowerCase()
    );

    if (!match) {
      return {
        found: false,
        message: `No pair found with AMM ID or name: ${pairId}`,
        searchedId: pairId,
      };
    }

    return {
      found: true,
      pair: match,
    };
  },
});
