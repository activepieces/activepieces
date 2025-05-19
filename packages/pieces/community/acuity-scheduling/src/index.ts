import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createAppointment, rescheduleAppointment, createClient, updateClient, addBlockedTime, findAppointments, listClients } from './lib/actions';
import { appointmentScheduled, appointmentCanceled } from './lib/triggers';

export const acuitySchedulingAuth = PieceAuth.BasicAuth({
  description:
    'Authenticate with your Acuity Scheduling User ID and API Key. You can find these in your Acuity Scheduling account under Integrations > API.',
  required: true,
  username: {
    displayName: 'User ID',
    description: 'Your Acuity Scheduling User ID',
  },
  password: {
    displayName: 'API Key',
    description: 'Your Acuity Scheduling API Key',
  },
});

export const acuityScheduling = createPiece({
  displayName: 'Acuity Scheduling',
  logoUrl: 'https://cdn.activepieces.com/pieces/acuity-scheduling.png',
  auth: acuitySchedulingAuth,
  minimumSupportedRelease: '0.36.1',
  authors: [],
  actions: [createAppointment, rescheduleAppointment, createClient, updateClient, addBlockedTime, findAppointments, listClients],
  triggers: [appointmentScheduled, appointmentCanceled],
});
