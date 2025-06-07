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
import { canceledAppointmentTrigger } from './lib/triggers/appointment-canceled';
import { updatedScheduleTrigger } from './lib/triggers/appointment-scheduled';

export const BASE_URL = 'https://acuityscheduling.com/api/v1/appointments';

export const acuityschedulingAuth = PieceAuth.CustomAuth({
 
  description: 'Authenticate with Acuity Scheduling API',
  required: true,
  props: {
    userId: PieceAuth.SecretText({
      displayName: 'User ID',
      description: 'Your Acuity Scheduling user ID',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Acuity Scheduling API key (found in Settings → Integrations → API)',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/appointments`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.userId,
          password: auth.apiKey,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid credentials. Please check your User ID and API Key.',
      };
    }
  },
});

export function createClient(auth: { userId: string, apiKey: string }) {
  return axios.create({
    baseURL: BASE_URL,
    auth: {
      username: auth.userId,
      password: auth.apiKey,
    },
    headers: {
      'Authorization': `Bearer ${auth.apiKey && auth.userId}`,
      'Content-Type': 'application/json',
    },
  });
}

export const acuityscheduling = createPiece({
  displayName: 'Acuity Scheduling',
  description: 'Professional appointment scheduling software',
  auth: acuityschedulingAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/acuityscheduling.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: [
    'ActivePieces'
  ],
  actions: [
    addBlockedTimeAction,
    createclientAction,
    findClientByNameAction,
    createAppointment,
    updateClientAction,
    rescheduleAppointmentAction,
    findAppointmentByClientInfoAction
  ],
  triggers: [
    canceledAppointmentTrigger,
    updatedScheduleTrigger
  ],
});