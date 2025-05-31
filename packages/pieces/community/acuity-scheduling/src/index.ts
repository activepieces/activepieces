import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addBlockedTime, createAppointment, createClient, findAppointmentsByClientInfo, listClients, rescheduleAppointment, updateClient } from './lib/actions';
import { appointmentCanceledTrigger, appointmentScheduledTrigger } from './lib/triggers';

export const acuityAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    userId: PieceAuth.SecretText({
      displayName: 'User ID',
      required: true,
      description: 'Your numeric Acuity Scheduling User ID',
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Your Acuity Scheduling API Key',
    }),
  },
});

export const acuityScheduling = createPiece({
  displayName: 'Acuity Scheduling',
  description: 'Manage appointments, clients, and availability with Acuity Scheduling.',
  auth: acuityAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/acuity.png',
  authors: ['krushnarout'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    findAppointmentsByClientInfo,
    listClients,
    createAppointment,
    rescheduleAppointment,
    createClient,
    updateClient,
    addBlockedTime,
  ],
  triggers: [
    appointmentScheduledTrigger,
    appointmentCanceledTrigger,
  ],
});
