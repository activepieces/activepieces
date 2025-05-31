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

export async function fetchCalendars(auth: AcuityAuthProps) {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API_URL}/calendars`,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
        },
    };
    const response = await httpClient.sendRequest<Array<{ id: number; name: string }>>(request);

    if (Array.isArray(response.body)) {
        return response.body.map(calendar => ({ label: calendar.name, value: calendar.id }));
    }
    return [];
}

export async function fetchFormFields(auth: AcuityAuthProps) {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API_URL}/forms`,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
        },
    };
    const response = await httpClient.sendRequest<Array<{ id: number; name: string; fields: Array<{ id: number; name: string }> }>>(request);

    if (Array.isArray(response.body)) {
        const formFields: Array<{ label: string; value: number }> = [];
        response.body.forEach(form => {
            if (Array.isArray(form.fields)) {
                form.fields.forEach(field => {
                    formFields.push({ label: `${form.name} - ${field.name}`, value: field.id });
                });
            }
        });
        return formFields;
    }
    return [];
}

export async function fetchAddons(auth: AcuityAuthProps, appointmentTypeId?: number) {
    // First, fetch all addons
    const allAddonsRequest: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API_URL}/appointment-addons`,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
        },
    };
    const allAddonsResponse = await httpClient.sendRequest<Array<{ id: number; name: string }>>(allAddonsRequest);

    if (!Array.isArray(allAddonsResponse.body)) {
        return [];
    }

    let compatibleAddonIds: number[] | null = null;

    // If appointmentTypeId is provided, fetch the specific appointment type to get its compatible addonIDs
    if (appointmentTypeId) {
        const appointmentTypeRequest: HttpRequest = {
            method: HttpMethod.GET,
            url: `${API_URL}/appointment-types/${appointmentTypeId}`,
            headers: {
                Authorization: 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
            },
        };
        try {
            const appointmentTypeResponse = await httpClient.sendRequest<{ addonIDs: number[] }>(appointmentTypeRequest);
            if (appointmentTypeResponse.body && Array.isArray(appointmentTypeResponse.body.addonIDs)) {
                compatibleAddonIds = appointmentTypeResponse.body.addonIDs;
            }
        } catch (e) {
            // Log error or handle if type not found, but still proceed with all addons if necessary
            console.warn(`Could not fetch compatible addons for appointment type ${appointmentTypeId}, returning all addons. Error: ${e}`)
        }
    }

    const allAddons = allAddonsResponse.body.map(addon => ({ label: addon.name, value: addon.id }));

    if (compatibleAddonIds) {
        return allAddons.filter(addon => compatibleAddonIds.includes(addon.value));
    }

    return allAddons;
}

export async function fetchLabels(auth: AcuityAuthProps) {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API_URL}/labels`,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
        },
    };
    const response = await httpClient.sendRequest<Array<{ id: number; name: string; color: string }>>(request);

    if (Array.isArray(response.body)) {
        return response.body.map(label => ({ label: `${label.name} (${label.color})`, value: label.id }));
    }
    return [];
}
