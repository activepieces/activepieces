import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { makeRequest } from '../common';

export const createSession = createAction({
  auth: airtopAuth,
  name: 'createSession',
  displayName: 'Create Session',
  description: 'Create a new Airtop session',
  props: {
    timeoutMinutes: Property.Number({
      displayName: 'Timeout Minutes',
      description: 'Session timeout in minutes',
      required: false,
      defaultValue: 10,
    }),
    profileName: Property.ShortText({
      displayName: 'Profile Name',
      description: 'Name for the session profile',
      required: false,
    }),
    proxy: Property.Checkbox({
      displayName: 'Use Proxy',
      description: 'Whether to use proxy for the session',
      required: false,
      defaultValue: false,
    }),
    solveCaptcha: Property.Checkbox({
      displayName: 'Solve Captcha',
      description: 'Whether to enable captcha solving',
      required: false,
      defaultValue: false,
    }),
    extensionIds: Property.Array({
      displayName: 'Extension IDs',
      description: 'List of extension IDs to load',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const { timeoutMinutes, profileName, proxy, solveCaptcha, extensionIds } =
      propsValue;

    const requestBody: any = {
      configuration: {
        extensionIds: extensionIds || [],
        timeoutMinutes: timeoutMinutes || 10,
        proxy: proxy || false,
        solveCaptcha: solveCaptcha || false,
      },
    };

    // Add profileName if provided
    if (profileName) {
      requestBody.configuration.profileName = profileName;
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/sessions',
      undefined,
      requestBody
    );

    return response;
  },
});
