import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Buffer } from 'buffer';

export const BASE_URL = 'https://acuityscheduling.com/api/v1';

export async function makeAcuityRequest(
  auth: { userId: string; apiKey: string },
  method: HttpMethod,
  path: string,
  body?: unknown,
  queryParams?: Record<string, string>
) {
  const credentials = Buffer.from(`${auth.userId}:${auth.apiKey}`).toString('base64');
  
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body,
    queryParams,
  });

  return response.body;
}

export async function fetchClients(auth: { userId: string; apiKey: string }, queryParams?: Record<string, string>) {
  return await makeAcuityRequest(auth, HttpMethod.GET, '/clients', undefined, queryParams);
}

export async function fetchCalendars(auth: { userId: string; apiKey: string }) {
  return await makeAcuityRequest(auth, HttpMethod.GET, '/calendars');
}

export async function fetchAppointmentTypes(auth: { userId: string; apiKey: string }) {
  return await makeAcuityRequest(auth, HttpMethod.GET, '/appointment-types');
}
