import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import { instanceLogin } from '../common';
import {
  AuthenticationType,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

//Docs: https://code.vtiger.com/vtiger/vtigercrm-manual/-/wikis/Webservice-Docs
//Extra: https://help.vtiger.com/article/147111249-Rest-API-Manual

export const makeAPICall = createAction({
  name: 'make_api_call',
  auth: vtigerAuth,
  displayName: 'Custom API Call',
  description: 'Performs an arbitrary authorized API call. ',
  props: {
    method: Property.StaticDropdown<HttpMethod>({
      displayName: 'Http Method',
      description: 'Select the HTTP method you want to use',
      required: true,
      options: {
        options: [
          { label: 'GET', value: HttpMethod.GET },
          { label: 'POST', value: HttpMethod.POST },
        ],
      },
    }),
    urlPath: Property.ShortText({
      displayName: 'URL',
      description: 'API endpoint\'s URL path (example: /me, /listtypes, /describe)',
      required: false,
    }),
    headers: Property.Json({
      displayName: 'Headers',
      description: `Enter the desired request headers. Skip the authorization headers`,
      required: true,
      defaultValue: {},
    }),
    data: Property.Json({
      displayName: 'Data',
      description: `Enter the data to pass. if its POST, it will be sent as body data, and if GET, as query string`,
      required: true,
      defaultValue: {},
    }),
  },
  async run({ propsValue, auth }) {
    const urlPath = propsValue.urlPath;

    if(urlPath && !urlPath.startsWith('/')){
      return {
        error: 'URL path must start with a slash, example: /me, /listtypes, /describe',
      };
    }

    const httpRequest: HttpRequest<HttpMessageBody> = {
      url: `${auth.instance_url}/webservice.php`,
      method: propsValue.method ?? HttpMethod.GET,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(propsValue.headers ?? {}),
      },
    };

    let data: Record<string, unknown> = {};

    if(urlPath){
      httpRequest.url = `${auth.instance_url}/restapi/v1/vtiger/default${urlPath}`;
      data = propsValue.data;

      httpRequest.authentication = {
        type: AuthenticationType.BASIC,
        username: auth.username,
        password: auth.password,
      };
    }
    else {
      const vtigerInstance = await instanceLogin(
        auth.instance_url,
        auth.username,
        auth.password
      );
      if (vtigerInstance === null) return;

      data = {
        sessionName: vtigerInstance.sessionId ?? vtigerInstance.sessionName,
        ...(propsValue.data ?? {}),
      };
    }

    httpRequest[propsValue.method === HttpMethod.GET ? 'queryParams' : 'body'] =
      data;

    const response = await httpClient.sendRequest<Record<string, unknown>[]>(
      httpRequest
    );

    if ([200, 201].includes(response.status)) {
      return response.body;
    }

    return {
      error: 'Unexpected outcome!',
    };
  },
});
