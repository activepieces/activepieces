import { baseUrl, getTimezones } from '../common';
import { sessionAuth } from '../..';
import {
  HttpMethod,
  httpClient,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

export const createSession = createAction({
  auth: sessionAuth,
  name: 'create_session',
  displayName: 'Create Session',
  description: 'Quickly create a session.',
  audience: 'both',
  aiMetadata: { description: 'Create a new session (a private video meeting) on Sessions.us with a name, start/end time, and timezone, returning the session id and join link. Use when an agent needs to schedule a meeting rather than a public registration-based event. Creates a new session each call, so it is not idempotent — repeating it produces duplicate sessions.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Session Name',
      description: 'The name of the session',
      required: true,
    }),
    startAt: Property.DateTime({
      displayName: 'Starts At',
      description: 'Select a date and time',
      required: true,
      defaultValue: new Date().toISOString(),
    }),
    plannedEnd: Property.DateTime({
      displayName: 'Ends At',
      description: 'Select a date and time',
      required: true,
      defaultValue: new Date().toISOString(),
    }),
    timezone: Property.Dropdown({
      auth: sessionAuth,
      displayName: 'Timezone',
      description: 'The timezone which the session will take place.',
      required: true,
      refreshers: [],
      options: async () => {
        const timezones = await getTimezones();

        return {
          options: timezones.map((timezone) => {
            return {
              label: timezone,
              value: timezone,
            };
          }),
        };
      },
    }),
  },

  async run({ propsValue, auth }) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/sessions`,
      headers: {
        'x-api-key': auth.secret_text,
      },
      body: {
        name: propsValue['name'],
        startAt: propsValue['startAt'],
        plannedEnd: propsValue['plannedEnd'],
        timeZone: propsValue['timezone'],
      },
    };

    const response = await httpClient.sendRequest(request);
    return {
      id: response.body['id'],
      name: response.body['name'],
      link: response.body['sessionLink'],
    };
  },
});
