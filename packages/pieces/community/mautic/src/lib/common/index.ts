import { Property } from '@activepieces/pieces-framework';
import { getFields } from './helper';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const mauticCommon = {
  contactFields: { ...getFields('contact'), ...getFields('lead') },
  companyFields: getFields('company'),
  id: Property.ShortText({
    displayName: 'Id of the entity',
    required: true,
  }),
};

export const searchEntity = async (
  url: string,
  searchParams: string,
  username: string,
  password: string
) => {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${url}${searchParams}`,
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
        'base64'
      )}`,
      'Content-Type': 'application/json',
    },
  };
  const response: Record<string, any> = await httpClient.sendRequest(request);
  const length = response.body.total;
  if (!length || length != 1)
    throw Error(
      'The query is not perfect enough to get single result. Please refine'
    );
  return response;
};
