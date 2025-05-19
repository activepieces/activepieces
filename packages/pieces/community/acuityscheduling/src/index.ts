import {
  createPiece,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import axios from 'axios';
import { addBlockedTimeAction } from './lib/actions/add-blocked-off-time';
import { createclientAction } from './lib/actions/create-client';
import { findClientByNameAction } from './lib/actions/list-clients'; 
import { createAppointment } from './lib/actions/create-appointment';
import { updateClientAction } from './lib/actions/update-client';
import { rescheduleAppointmentAction } from './lib/actions/reschedule-appointment';
import { findAppointmentByClientInfoAction } from './lib/actions/find-appointments-by-client-info';

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
  actions: [ addBlockedTimeAction,
    createclientAction,
    findClientByNameAction,
    createAppointment,
    updateClientAction,
    rescheduleAppointmentAction,
    findAppointmentByClientInfoAction
  ],
  triggers: [],
});