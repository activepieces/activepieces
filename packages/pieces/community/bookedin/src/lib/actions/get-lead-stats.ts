import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../../index';
import { BASE_URL, getBookedinHeaders } from '../common/props';

export const getLeadStats = createAction({
  name: 'getLeadStats',
  displayName: 'Get Lead Stats',
  description: 'Get lead outcome statistics (Hot, Warm, Cold, Objectives Met, Total)',
  auth: bookedinAuth,
  props: {},
  async run({ auth }) {
    
    const apiKey = typeof auth === 'string' 
      ? auth 
      : (auth as any)?.secret_text || (auth as any)?.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BASE_URL}/leads/stats`,
      headers: getBookedinHeaders(apiKey as string),
    });

    return response.body;
  },
});