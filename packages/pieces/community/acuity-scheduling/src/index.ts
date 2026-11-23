import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import {
	addBlockedTimeAction,
	createAppointmentAction,
	createClientAction,
	findAppointmentAction,
	findClientAction,
	rescheduleAppointmentAction,
	updateClientAction,
} from './lib/actions';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { API_URL } from './lib/common';
import { appointmentCanceledTrigger, appointmentScheduledTrigger } from './lib/triggers';
import { acuitySchedulingAuth } from './lib/auth';

export const acuityScheduling = createPiece({
	displayName: 'Acuity Scheduling',
	logoUrl: 'https://cdn.activepieces.com/pieces/acuity-scheduling.png',
	auth: acuitySchedulingAuth,
	categories: [PieceCategory.PRODUCTIVITY, PieceCategory.SALES_AND_CRM],
	minimumSupportedRelease: '0.88.2',
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
			props: {
				url: {
					description: `Full URL, or a path relative to ${API_URL}`,
					placeholder: '/appointments',
				},
			},
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth.access_token}`,
				};
			},
		}),
	],
	triggers: [appointmentCanceledTrigger, appointmentScheduledTrigger],
});
