import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../../';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { commonProps } from '../common';

export const urlInspection = createAction({
  auth: googleSearchConsoleAuth,
  name: 'urlInspection',
  displayName: 'URL Inspection',
  description:
    "Use the URL Inspection action to check the status and presence of a specific page within Google's index.",
  props: {
    siteUrl: commonProps.siteUrl,
    url: Property.ShortText({
      displayName: 'URL to Inspect',
      required: true,
    }),
  },
  async run(context) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: { 'Content-Type': 'application/json' },
      body: {
        inspectionUrl: context.propsValue.url,
        siteUrl: context.propsValue.siteUrl,
      },
    };

    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});
