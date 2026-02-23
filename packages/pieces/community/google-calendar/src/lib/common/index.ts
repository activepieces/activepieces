import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { getCalendars, getColors, getEventsForDropdown } from './helper';
import { AppConnectionType } from '@activepieces/shared';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const googleCalendarScopes = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

export const googleCalendarAuth = [PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  pkce: true,
  scope: googleCalendarScopes,
}), PieceAuth.CustomAuth({
  displayName: 'Service Account (Advanced)',
  description: 'Authenticate via service account from https://console.cloud.google.com/ > IAM & Admin > Service Accounts > Create Service Account > Keys > Add key.  <br> <br> You can optionally use domain-wide delegation (https://support.google.com/a/answer/162106?hl=en#zippy=%2Cset-up-domain-wide-delegation-for-a-client) to access calendars without adding the service account to each one. <br> <br> **Note:** Without a user email, the service account only has access to calendars you explicitly share with it.',
  required: true,
  props: {
    serviceAccount: Property.ShortText({
      displayName: 'Service Account JSON Key',
      required: true,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      required: false,
      description: 'Email address of the user to impersonate for domain-wide delegation.',
    }),
  },
  validate: async ({ auth }) => {
    try {
      await getAccessToken({
        type: AppConnectionType.CUSTOM_AUTH,
        props: { ...auth },
      });
    } catch (e) {
      return {
        valid: false,
        error: (e as Error).message,
      };
    }
    return {
      valid: true,
    };
  },
})];

export type GoogleCalendarAuthValue = AppConnectionValueForAuthProperty<typeof googleCalendarAuth>;

export async function createGoogleClient(auth: GoogleCalendarAuthValue): Promise<OAuth2Client> {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const serviceAccount = JSON.parse(auth.props.serviceAccount);
    return new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: googleCalendarScopes,
      subject: auth.props.userEmail,
    });
  }
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);
  return authClient;
}

export const getAccessToken = async (auth: GoogleCalendarAuthValue): Promise<string> => {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const googleClient = await createGoogleClient(auth);
    const response = await googleClient.getAccessToken();
    if (response.token) {
      return response.token;
    } else {
      throw new Error('Could not retrieve access token from service account json');
    }
  }
  return auth.access_token;
};

export const googleCalendarCommon = {
  baseUrl: 'https://www.googleapis.com/calendar/v3',
  calendarDropdown: (minAccessRole?: 'writer') => {
    return Property.Dropdown<string,true,typeof googleCalendarAuth>({
      auth: googleCalendarAuth,
      displayName: 'Calendar',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        const authValue = auth as GoogleCalendarAuthValue;
        const calendars = await getCalendars(authValue, minAccessRole);
        return {
          disabled: false,
          options: calendars.map((calendar) => {
            return {
              label: calendar.summary,
              value: calendar.id,
            };
          }),
        };
      },
    });
  },
  eventDropdown: (required = false) => {
    return Property.Dropdown<string,boolean,typeof googleCalendarAuth>({
      displayName: 'Event',
      refreshers: ['calendar_id'],
      required: required,
      auth: googleCalendarAuth,
      options: async ({ auth, calendar_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        if (!calendar_id) {
          return {
            disabled: true,
            placeholder: 'Please select a calendar first',
            options: [],
          };
        }
        const authValue = auth as GoogleCalendarAuthValue;
        const events = await getEventsForDropdown(
          authValue,
          calendar_id as string
        );
        return {
          disabled: false,
          options: events,
        };
      },
    });
  },
  colorId: Property.Dropdown({
    auth: googleCalendarAuth,
    displayName: 'Color',
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      const response = await getColors(auth as GoogleCalendarAuthValue);
      return {
        disabled: false,
        options: Object.entries(response.event).map(([key, value]) => {
          return {
            label: value.background,
            value: key,
          };
        }),
      };
    },
  }),
};
