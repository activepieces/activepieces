import { Property } from '@activepieces/pieces-framework';
import { meetgeekaiAuth } from './auth';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const meetingIdDropdwon = Property.Dropdown({
  auth: meetgeekaiAuth,
  displayName: 'Meeting',
  description: 'Select the meeting',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/meetings'
      );
      if (!response.meetings || response.meetings.length === 0) {
        return {
          disabled: true,
          placeholder: 'No meetings found',
          options: [],
        };
      }
      return {
        disabled: false,
        options: response.meetings.map((meeting: any) => ({
          label:
            meeting.title || meeting.meeting_id + meeting.timestamp_start_utc,
          value: meeting.meeting_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load meetings',
        options: [],
      };
    }
  },
});

export const teamIdDropdown = Property.Dropdown({
  auth: meetgeekaiAuth,
  displayName: 'Team',
  description: 'Select the team',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/teams'
      );

      const allTeams = new Map();

      if (response.share_access) {
        response.share_access.forEach((team: any) => {
          allTeams.set(team.id, {
            label: `${team.name} (Share Access)`,
            value: team.id,
          });
        });
      }

      if (response.view_access) {
        response.view_access.forEach((team: any) => {
          if (allTeams.has(team.id)) {
            allTeams.set(team.id, {
              label: `${team.name} (Share & View Access)`,
              value: team.id,
            });
          } else {
            allTeams.set(team.id, {
              label: `${team.name} (View Access)`,
              value: team.id,
            });
          }
        });
      }

      return {
        disabled: false,
        options: Array.from(allTeams.values()),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams. Please reconnect your account.',
      };
    }
  },
});
