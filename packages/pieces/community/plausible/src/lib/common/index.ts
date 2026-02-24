import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { plausibleAuth } from '../..';

export const plausibleCommon = {
  baseUrl: 'https://plausible.io/api/v1',
};

export async function plausibleApiCall<T>({
  apiKey,
  method,
  endpoint,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const request: HttpRequest = {
    url: `${plausibleCommon.baseUrl}${endpoint}`,
    method,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    body,
    queryParams,
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export async function getSites(apiKey: string) {
  const response = await plausibleApiCall<{
    sites: { domain: string; timezone: string }[];
  }>({
    apiKey,
    method: HttpMethod.GET,
    endpoint: '/sites',
  });
  return response.sites;
}

export const siteIdDropdown = Property.Dropdown({
  displayName: 'Site',
  description: 'Select a site',
  required: true,
  auth: plausibleAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }
    const sites = await getSites(auth.secret_text);
    return {
      disabled: false,
      options: sites.map((site) => ({
        label: site.domain,
        value: site.domain,
      })),
    };
  },
});

export const optionalSiteIdDropdown = Property.Dropdown({
  displayName: 'Site',
  description: 'Select a site',
  required: false,
  auth: plausibleAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }
    const sites = await getSites(auth.secret_text);
    return {
      disabled: false,
      options: sites.map((site) => ({
        label: site.domain,
        value: site.domain,
      })),
    };
  },
});

export async function getTeams(apiKey: string) {
  const response = await plausibleApiCall<{
    teams: { id: string; name: string; api_available: boolean }[];
  }>({
    apiKey,
    method: HttpMethod.GET,
    endpoint: '/sites/teams',
  });
  return response.teams;
}

export const teamIdDropdown = Property.Dropdown({
  displayName: 'Team',
  description: 'Select a team',
  required: false,
  refreshers: [],
  auth: plausibleAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }
    const teams = await getTeams(auth.secret_text);
    return {
      disabled: false,
      options: teams
        .filter((team) => team.api_available)
        .map((team) => ({
          label: team.name,
          value: team.id,
        })),
    };
  },
});

export async function getGoals(apiKey: string, siteId: string) {
  const response = await plausibleApiCall<{
    goals: {
      id: string;
      goal_type: string;
      display_name: string;
      event_name: string | null;
      page_path: string | null;
    }[];
  }>({
    apiKey,
    method: HttpMethod.GET,
    endpoint: '/sites/goals',
    queryParams: { site_id: siteId },
  });
  return response.goals;
}

export const goalIdDropdown = Property.Dropdown({
  displayName: 'Goal',
  description: 'Select a goal',
  required: true,
  auth: plausibleAuth,
  refreshers: ['site_id'],
  options: async ({ auth, site_id }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }
    if (!site_id) {
      return {
        disabled: true,
        placeholder: 'Select a site first',
        options: [],
      };
    }
    const goals = await getGoals(auth.secret_text, site_id as string);
    return {
      disabled: false,
      options: goals.map((goal) => ({
        label: goal.display_name,
        value: goal.id,
      })),
    };
  },
});

export async function getCustomProperties(apiKey: string, siteId: string) {
  const response = await plausibleApiCall<{
    custom_properties: { property: string }[];
  }>({
    apiKey,
    method: HttpMethod.GET,
    endpoint: '/sites/custom-props',
    queryParams: { site_id: siteId },
  });
  return response.custom_properties;
}

export const customPropertyDropdown = Property.Dropdown({
  displayName: 'Custom Property',
  description: 'Select a custom property',
  required: true,
  auth: plausibleAuth,
  refreshers: ['site_id'],
  options: async ({ auth, site_id }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }
    if (!site_id) {
      return {
        disabled: true,
        placeholder: 'Select a site first',
        options: [],
      };
    }
    const props = await getCustomProperties(auth.secret_text, site_id as string);
    return {
      disabled: false,
      options: props.map((prop) => ({
        label: prop.property,
        value: prop.property,
      })),
    };
  },
});

export async function getGuests(apiKey: string, siteId: string) {
  const response = await plausibleApiCall<{
    guests: { email: string; role: string; status: string }[];
  }>({
    apiKey,
    method: HttpMethod.GET,
    endpoint: '/sites/guests',
    queryParams: { site_id: siteId },
  });
  return response.guests;
}

export const guestEmailDropdown = Property.Dropdown({
  displayName: 'Guest',
  description: 'Select a guest',
  required: true,
  auth: plausibleAuth,
  refreshers: ['site_id'],
  options: async ({ auth, site_id }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }
    if (!site_id) {
      return {
        disabled: true,
        placeholder: 'Select a site first',
        options: [],
      };
    }
    const guests = await getGuests(auth.secret_text, site_id as string);
    return {
      disabled: false,
      options: guests.map((guest) => ({
        label: `${guest.email} (${guest.role})`,
        value: guest.email,
      })),
    };
  },
});
