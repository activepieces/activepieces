import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sessionIdDropdown } from '../common/props';
import { makeRequest } from '../common';
import { airtopAuth } from '../common/auth';

export const createNewBrowserWindow = createAction({
  auth: airtopAuth,
  name: 'createNewBrowserWindow',
  displayName: 'Create New Browser Window',
  description: 'Create a new browser window in an Airtop session',
  props: {
    sessionId: sessionIdDropdown,
    url: Property.ShortText({
      displayName: 'Initial URL',
      description:
        'Initial URL to navigate to (defaults to https://www.google.com)',
      required: false,
      defaultValue: 'https://www.google.com',
    }),
    screenResolution: Property.StaticDropdown({
      displayName: 'Screen Resolution',
      description: 'Screen resolution for the window (defaults to 1280x720)',
      required: false,
      defaultValue: '1280x720',
      options: {
        options: [
          { label: '1280x720', value: '1280x720' },
          { label: '1920x1080', value: '1920x1080' },
          { label: '1366x768', value: '1366x768' },
          { label: '1440x900', value: '1440x900' },
          { label: '1600x900', value: '1600x900' },
        ],
      },
    }),
    waitUntil: Property.StaticDropdown({
      displayName: 'Wait Until',
      description: 'Wait until the specified loading event occurs',
      required: false,
      defaultValue: 'load',
      options: {
        options: [
          { label: 'Load', value: 'load' },
          { label: 'DOM Content Loaded', value: 'domContentLoaded' },
          { label: 'Complete', value: 'complete' },
          { label: 'No Wait', value: 'noWait' },
        ],
      },
    }),
    waitUntilTimeoutSeconds: Property.Number({
      displayName: 'Wait Until Timeout (seconds)',
      description:
        'Maximum time in seconds to wait for the loading event (defaults to 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const {
      sessionId,
      url,
      screenResolution,
      waitUntil,
      waitUntilTimeoutSeconds,
    } = propsValue;

    const requestBody: any = {};

    // Add optional parameters if provided
    if (url) {
      requestBody.url = url;
    }
    if (screenResolution) {
      requestBody.screenResolution = screenResolution;
    }
    if (waitUntil) {
      requestBody.waitUntil = waitUntil;
    }
    if (waitUntilTimeoutSeconds) {
      requestBody.waitUntilTimeoutSeconds = waitUntilTimeoutSeconds;
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/sessions/${sessionId}/windows`,
      undefined,
      requestBody
    );

    return response;
  },
});
