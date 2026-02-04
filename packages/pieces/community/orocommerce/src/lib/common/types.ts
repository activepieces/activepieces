import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

import { orocommerceAuth } from './auth';

export type OroCommerceAuth = AppConnectionValueForAuthProperty<typeof orocommerceAuth>;

export type OroCommerceAuthResponseType = {
  token_type: string;
  access_token: string;
  expires_in: number;
};

export type OroCommerceApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  auth: OroCommerceAuth;
  queryParams?: QueryParams;
  body?: HttpMessageBody;
};
