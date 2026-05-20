import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { weekdoneAuth } from '../auth';

async function fetchUsers({ token }: { token: string }): Promise<WeekdoneUser[]> {
  const response = await httpClient.sendRequest<{ status: string; users: WeekdoneUser[] }>({
    method: HttpMethod.GET,
    url: `https://api.weekdone.com/1/users?token=${token}`,
  });
  return response.body.users ?? [];
}

async function fetchTeams({ token }: { token: string }): Promise<WeekdoneTeam[]> {
  const response = await httpClient.sendRequest<{ status: string; teams: WeekdoneTeam[] }>({
    method: HttpMethod.GET,
    url: `https://api.weekdone.com/1/teams?token=${token}`,
  });
  return response.body.teams ?? [];
}

function userDropdown({
  displayName,
  description,
  required,
}: {
  displayName: string;
  description: string;
  required: boolean;
}) {
  return Property.Dropdown({
    displayName,
    description,
    required,
    auth: weekdoneAuth,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
      }
      const token = (auth as { access_token: string }).access_token;
      try {
        const users = await fetchUsers({ token });
        return {
          disabled: false,
          options: users.map((u) => ({ label: u.name, value: u.id })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load users.' };
      }
    },
  });
}

function teamDropdown({
  displayName,
  description,
  required,
}: {
  displayName: string;
  description: string;
  required: boolean;
}) {
  return Property.Dropdown({
    displayName,
    description,
    required,
    auth: weekdoneAuth,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
      }
      const token = (auth as { access_token: string }).access_token;
      try {
        const teams = await fetchTeams({ token });
        return {
          disabled: false,
          options: teams.map((t) => ({ label: t.name, value: t.id })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load teams.' };
      }
    },
  });
}

export const weekdoneCommon = { fetchUsers, fetchTeams, userDropdown, teamDropdown };

export type WeekdoneUser = {
  id: number;
  name: string;
  team_id: number;
};

export type WeekdoneTeam = {
  id: number;
  name: string;
};
