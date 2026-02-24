import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

import { oroAuth } from './auth';

export type OroAuth = AppConnectionValueForAuthProperty<typeof oroAuth>;

export type OroAuthResponseType = {
  token_type: string;
  access_token: string;
  expires_in: number;
};

export type OroApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  auth: OroAuth;
  queryParams?: QueryParams;
  body?: HttpMessageBody;
  headers?: Record<string, string>;
};

export interface OroJsonApiItem {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

export interface OroJsonApiCollection {
  data: OroJsonApiItem[];
}
