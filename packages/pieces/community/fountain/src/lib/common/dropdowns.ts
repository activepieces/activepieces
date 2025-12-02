import { PiecePropValueSchema, DropdownOption, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders, getApiUrl } from './auth';

export async function getFunnelsDropdown(auth: AppConnectionValueForAuthProperty<typeof fountainAuth>): Promise<DropdownOption<string>[]> {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(auth, '/funnels'),
      headers: getAuthHeaders(auth),
      queryParams: { per_page: '100' },
    });

    const funnels = response.body?.funnels || [];
    return funnels.map((funnel: any) => ({
      label: funnel.title || `Opening ${funnel.id}`,
      value: funnel.id,
    }));
  } catch (error) {
    return [];
  }
}

export async function getLocationsDropdown(auth: AppConnectionValueForAuthProperty<typeof fountainAuth>): Promise<DropdownOption<string>[]> {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(auth, '/funnels'),
      headers: getAuthHeaders(auth),
      queryParams: { per_page: '100' },
    });

    const funnels = response.body?.funnels || [];
    const locations = new Map();

    funnels.forEach((funnel: any) => {
      if (funnel.location && funnel.location.id && !locations.has(funnel.location.id)) {
        locations.set(funnel.location.id, {
          label: funnel.location.name || `Location ${funnel.location.id}`,
          value: funnel.location.id,
        });
      }
    });

    return Array.from(locations.values());
  } catch (error) {
    return [];
  }
}

export async function getUsersDropdown(auth: AppConnectionValueForAuthProperty<typeof fountainAuth>): Promise<DropdownOption<string>[]> {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(auth, '/funnels'),
      headers: getAuthHeaders(auth),
      queryParams: { per_page: '100' },
    });

    const funnels = response.body?.funnels || [];
    const users = new Map();

    funnels.forEach((funnel: any) => {
      if (funnel.owner && funnel.owner.id && !users.has(funnel.owner.id)) {
        users.set(funnel.owner.id, {
          label: funnel.owner.name || funnel.owner.email || `User ${funnel.owner.id}`,
          value: funnel.owner.id,
        });
      }
    });

    return Array.from(users.values());
  } catch (error) {
    return [];
  }
}

export async function getStagesForFunnelDropdown(
  auth: AppConnectionValueForAuthProperty<typeof fountainAuth>,
  funnelId?: string
): Promise<DropdownOption<string>[]> {
  if (!funnelId) {
    return [];
  }

  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(auth, `/funnels/${funnelId}/stages`),
      headers: getAuthHeaders(auth),
    });

    const stages = response.body?.stages || [];
    return stages.map((stage: any) => ({
      label: stage.title || `Stage ${stage.id}`,
      value: stage.id,
    }));
  } catch (error) {
    return [];
  }
}

