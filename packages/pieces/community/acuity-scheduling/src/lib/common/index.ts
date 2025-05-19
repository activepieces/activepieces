import { HttpMethod, httpClient, HttpRequest } from '@activepieces/pieces-common';

export const API_URL = 'https://acuityscheduling.com/api/v1';

export interface AcuityAuthProps {
    username: string;
    password: string;
}

export async function fetchAvailableDates(auth: AcuityAuthProps, appointmentTypeId: number, month: string, timezone?: string, calendarId?: number) {
  const queryParams: Record<string, string> = {
    month,
    appointmentTypeID: appointmentTypeId.toString(),
  };

  if (timezone) queryParams['timezone'] = timezone;
  if (calendarId) queryParams['calendarID'] = calendarId.toString();

  const response = await httpClient.sendRequest<Array<{ date: string }>>({
    method: HttpMethod.GET,
    url: `${API_URL}/availability/dates`,
    queryParams,
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
    },
  });

  if (Array.isArray(response.body)) {
    return response.body.map(item => item.date);
  }
  return [];
}

export async function fetchAvailableTimes(auth: AcuityAuthProps, appointmentTypeId: number, date: string, timezone?: string, calendarId?: number, ignoreAppointmentIDs?: number[]) {
  const params = new URLSearchParams();
  params.append('date', date);
  params.append('appointmentTypeID', appointmentTypeId.toString());

  if (timezone) params.append('timezone', timezone);
  if (calendarId) params.append('calendarID', calendarId.toString());
  if (ignoreAppointmentIDs && ignoreAppointmentIDs.length > 0) {
    ignoreAppointmentIDs.forEach(id => params.append('ignoreAppointmentIDs[]', id.toString()));
  }

  const response = await httpClient.sendRequest<Array<{ time: string; datetime: string }>>({
    method: HttpMethod.GET,
    url: `${API_URL}/availability/times?${params.toString()}`,
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
    },
  });

  return response.body;
}

// Helper function to get full appointment details
export async function getAppointmentDetails(appointmentId: string, auth: AcuityAuthProps) {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API_URL}/appointments/${appointmentId}`,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
        },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
}

export async function fetchAppointmentTypes(auth: AcuityAuthProps, includeDeleted = false) {
    const queryParams: Record<string, string> = {};
    if (includeDeleted) {
        queryParams['includeDeleted'] = 'true';
    }

    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API_URL}/appointment-types`,
        queryParams,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
        },
    };
    const response = await httpClient.sendRequest<Array<{ id: number; name: string; active: boolean | string }>>(request);

    if (Array.isArray(response.body)) {
        // Filter for active types unless includeDeleted is true, and map to dropdown options
        return response.body
            .filter(type => includeDeleted || type.active === true || type.active === 'true')
            .map(type => ({ label: type.name, value: type.id }));
    }
    return [];
}
