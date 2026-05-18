import {
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { MatomoAuthType } from './auth';

const matomoAPI = async (
  api         : string,
  auth        : MatomoAuthType,
  queryParams : QueryParams = {}
) => {
	queryParams['module'] = 'API';
	queryParams['format'] = 'JSON';
	queryParams['method'] = api;
	queryParams['idSite'] = auth.siteId;

  const formData = new FormData();
  formData.append('token_auth', auth.tokenAuth);

  const request: HttpRequest = {
	method      : HttpMethod.POST,
	url         : `${auth.domain}`,
	queryParams : queryParams,
	body        : formData,
	headers     : {
		'Content-Type': 'multipart/form-data',
	},
  };
  const response = await httpClient.sendRequest(request);

  if (
    response.status !== 200 ||
    (response.body['result'] && response.body['result'] === 'error')
  ) {
    throw new Error(`Matomo API request failed: ${response.body['message']}`);
  }

  return {
    success: true,
    data: response.body,
  };
};

export async function getVersion(auth: MatomoAuthType) {
  const api = 'API.getMatomoVersion';
  return matomoAPI(api, auth);
}

export async function addAnnotation(auth: MatomoAuthType, data: QueryParams) {
  const api = 'Annotations.add';
  return matomoAPI(api, auth, data);
}
