import { createPiece, PieceAuth, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addBlockedTime, createAppointment, createClient, findAppointmentsByClientInfo, listClients, rescheduleAppointment, updateClient } from './lib/actions';
import { appointmentCanceledTrigger, appointmentScheduledTrigger } from './lib/triggers';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { Buffer } from 'buffer';

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
    createCustomApiCallAction({
      auth: acuityAuth,
      baseUrl: () => 'https://acuityscheduling.com/api/v1',
      authMapping: async (auth) => {
        const authValue = auth as PiecePropValueSchema<typeof acuityAuth>;
        const base64Credentials = Buffer.from(`${authValue.userId}:${authValue.apiKey}`).toString('base64');
        return {
          Authorization: `Basic ${base64Credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
      },
    }),
  ],
  triggers: [
    appointmentScheduledTrigger,
    appointmentCanceledTrigger,
  ],
});
