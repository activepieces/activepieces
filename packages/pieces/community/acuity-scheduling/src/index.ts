import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import {
	addBlockedTimeAction,
	createAppointmentAction,
	createClientAction,
	findAppointmentAction,
	findClientAction,
	rescheduleAppointmentAction,
	updateClientAction,
} from './lib/actions';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { API_URL } from './lib/common';
import { appointmentCanceledTrigger, appointmentScheduledTrigger } from './lib/triggers';

export const acuitySchedulingAuth = PieceAuth.OAuth2({
	required: true,
	authUrl: 'https://acuityscheduling.com/oauth2/authorize',
	tokenUrl: 'https://acuityscheduling.com/oauth2/token',
	scope: ['api-v1'],
});

export const acuityScheduling = createPiece({
	displayName: 'Acuity Scheduling',
	logoUrl: 'https://cdn.activepieces.com/pieces/acuity-scheduling.png',
	auth: acuitySchedulingAuth,
	categories: [PieceCategory.PRODUCTIVITY, PieceCategory.SALES_AND_CRM],
	minimumSupportedRelease: '0.36.1',
	authors: ['onyedikachi-david', 'kishanprmr'],
	actions: [
		addBlockedTimeAction,
		createAppointmentAction,
		createClientAction,
		rescheduleAppointmentAction,
		updateClientAction,
		findAppointmentAction,
		findClientAction,
		createCustomApiCallAction({
			auth: acuitySchedulingAuth,
			baseUrl: () => API_URL,
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
				};
			},
		}),
	],
	triggers: [appointmentCanceledTrigger, appointmentScheduledTrigger],
});
