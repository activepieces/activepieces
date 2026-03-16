import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { TRUEFI_LLAMA_URL } from '../truefi-api';

export const getLendingStats = createAction({
  name: 'get-lending-stats',
  displayName: 'Get Lending Stats',
  description: 'Get TrueFi current chain TVLs, methodology, and description',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: TRUEFI_LLAMA_URL,
    });
    const data = response.body;
    return {
      currentChainTvls: data.currentChainTvls ?? {},
      methodology: data.methodology ?? null,
      description: data.description ?? null,
    };
  },
});
