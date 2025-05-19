import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import axios from 'axios';

export const BASE_URL = 'https://acuityscheduling.com/api/v1';

export const acuityschedulingAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: `You can create an API key by navigating to **Setting -> Extensions -> API**.`,
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: `${BASE_URL}/page/getInfo`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth as string,
				},
			});
			return {
				valid: true,
			};
		} catch (e) {
			return {
				valid: false,
				error: 'Invalid API Key',
			};
		}
	},
});

export function createClient(auth: { apiKey: string}) {
  return axios.create({
    url: BASE_URL,
    headers: {
      'Authorization': `Bearer ${auth.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

export const acuityscheduling = createPiece({
  displayName: 'Acuity Scheduling',
  description: 'Appointment scheduling software',
  auth: acuityschedulingAuth ,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/acuityscheduling.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: [],
  actions: [],
  triggers: [],
});