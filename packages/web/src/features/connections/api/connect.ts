import {
  AppConnectionWithoutSensitiveData,
  ConnectOAuth2UrlRequest,
  ExchangeConnectTokenResponse,
  GetOAuth2AuthorizationUrlResponse,
  SaveConnectConnectionRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const connectApi = {
  exchange(token: string): Promise<ExchangeConnectTokenResponse> {
    return api.post<ExchangeConnectTokenResponse>('/v1/connect/exchange', {
      token,
    });
  },
  save(
    request: SaveConnectConnectionRequest,
  ): Promise<AppConnectionWithoutSensitiveData> {
    return api.post<AppConnectionWithoutSensitiveData>(
      '/v1/connect/connections',
      request,
    );
  },
  getOAuth2AuthorizationUrl(
    request: ConnectOAuth2UrlRequest,
  ): Promise<GetOAuth2AuthorizationUrlResponse> {
    return api.post<GetOAuth2AuthorizationUrlResponse>(
      '/v1/connect/oauth2/authorization-url',
      request,
    );
  },
};
