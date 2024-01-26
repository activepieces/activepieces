import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import { instanceLogin } from '../common';
import {
  HttpError,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

//Docs: https://code.vtiger.com/vtiger/vtigercrm-manual/-/wikis/Webservice-Docs
//Extra: https://help.vtiger.com/article/147111249-Rest-API-Manual

export const makeAPICall = createAction({
  name: 'make_api_call',
  auth: vtigerAuth,
  displayName: 'Custom API Call',
  description: 'Performs an arbitrary authorized API call.',
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
    headers: Property.Object({
      displayName: 'Headers',
      description: `Enter the desired request headers. Skip the authorization headers`,
      required: true,
      defaultValue: {},
    }),
    queryParams: Property.Object({
      displayName: 'Query Parameters',
      description: `Enter the desired request headers. Skip the authorization headers`,
      required: true,
      defaultValue: {},
    }),
    body: Property.Json({
      displayName: 'Data',
      description: `Enter the data to pass. if its POST, it will be sent as body data, and if GET, as query string`,
      required: true,
      defaultValue: {},
    }),
    failsafe: Property.Checkbox({
      displayName: 'No Error on Failure',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (in seconds)',
      required: false,
    })
  },
  async run({ propsValue, auth }) {
    const vtigerInstance = await instanceLogin(
      auth.instance_url,
      auth.username,
      auth.password
    );
    if (vtigerInstance === null) return;

    const request: HttpRequest<HttpMessageBody> = {
      url: `${auth.instance_url}/webservice.php`,
      method: propsValue.method ?? HttpMethod.GET,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(propsValue.headers ?? {}),
      }
    }

    switch (propsValue.method) {
      case HttpMethod.POST:
        request.body = {
          sessionName: vtigerInstance.sessionId ?? vtigerInstance.sessionName,
          ...propsValue.queryParams
        }
        break;
      case HttpMethod.GET:
        request.queryParams = {
          sessionName: vtigerInstance.sessionId ?? vtigerInstance.sessionName,
          ...propsValue.queryParams
        } as QueryParams
        break;
      default:
        break;
    }

    try {
      return await httpClient.sendRequest(request);
    } catch (error) {
      if (propsValue.failsafe) {
        return (error as HttpError).errorMessage()
      }
      throw error;
    }
  },
});
