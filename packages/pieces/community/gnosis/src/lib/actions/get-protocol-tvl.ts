import { createAction } from '@activepieces/pieces-framework';
import { llamaGet, GNOSIS_PROTOCOL_SLUG } from '../gnosis-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get the total value locked (TVL) on Gnosis Chain from DeFiLlama, including breakdown by token and chain.',
  props: {},
  async run() {
    const data = await llamaGet<Record<string, unknown>>(`/protocol/${GNOSIS_PROTOCOL_SLUG}`);
    return data;
  },
});
