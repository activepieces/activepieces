import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { createTrigger } from '@activepieces/pieces-framework';

export const beamerCommon = {
  baseUrl: 'https://api.getbeamer.com/v0',
};

// export const common = {
//   subscribeWebhook: async ( webhookUrl: string) => {
//     const request: HttpRequest = {
//         method: HttpMethod.GET,
//         url: '',
//     }
//     await httpClient.sendRequest(request);
// },
// }
