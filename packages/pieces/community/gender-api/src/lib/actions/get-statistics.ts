import { createAction, Property } from '@activepieces/pieces-framework';
import { genderApiAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getStatistics = createAction({
  auth: genderApiAuth,
  name: 'getStatistics',
  displayName: 'Get Statistics',
  description:
    'Get account statistics including remaining credits and usage information',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://gender-api.com/v2/statistic',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.auth.secret_text}`,
      },
    });

    return response.body;
  },
});
