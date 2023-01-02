import axios, { AxiosError } from "axios";
import qs from "qs";
import {
  ClaimTokenFromCloudRequest,
  ClaimTokenWithSecretRequest,
  CloudOAuth2Config,
  ConfigType,
  OAuth2Config,
  OAuth2Response,
} from "shared";

export const oauth2Service = {
  claim: async (request: ClaimTokenWithSecretRequest): Promise<unknown> => {
    try {
      let response = (
        await axios.post(
          request.tokenUrl,
          qs.stringify({
            client_id: request.clientId,
            client_secret: request.clientSecret,
            redirect_uri: request.redirectUrl,
            grant_type: "authorization_code",
            code: request.code,
          }),
          {
            headers: { "content-type": "application/x-www-form-urlencoded" },
          }
        )
      ).data;
      const secondsSinceEpoch = Math.round(Date.now() / 1000)
      let formattedResponse: OAuth2Response = {
        access_token: response['access_token'],
        expires_in: response['expires_in'],
        claimed_at: secondsSinceEpoch,
        refresh_token: response['refresh_token'],
        scope: response['scope'],
        token_type: response['token_type'],
        data: response
      };
      delete formattedResponse.data['access_token'];
      delete formattedResponse.data['expires_in'];
      delete formattedResponse.data['refresh_token'];
      delete formattedResponse.data['scope'];
      delete formattedResponse.data['token_type'];
      
      return formattedResponse;
    } catch (e: unknown | AxiosError) {
      if (axios.isAxiosError(e)) {
        return e.response?.data;
      }
      return e;
    }
  },
  claimWithCloud: async (request: ClaimTokenFromCloudRequest): Promise<unknown> => {
    try {
      return (await axios.post("https://secrets.activepieces.com/claim", request)).data;
    } catch (e: unknown | AxiosError) {
      if (axios.isAxiosError(e)) {
        return e.response?.data;
      }
      return e;
    }
  },
  refreshToken: async (request: CloudOAuth2Config | OAuth2Config): Promise<unknown> => {
    switch (request.type) {
      case ConfigType.CLOUD_OAUTH2:
        // TODO IMPLEMENT CLOUD AUTHENTICATION
        throw new Error("Cloud Authentication is not implemented yet");
      case ConfigType.OAUTH2:
        return refreshConfig(request);
    }
  },
};

function refreshConfig(config: OAuth2Config) {
  try {
    return axios.post(
      config.settings.tokenUrl,
      qs.stringify({
        client_id: config.settings.clientId,
        client_secret: config.settings.clientSecret,
        redirect_uri: config.settings.redirectUrl,
        grant_type: "refresh_token",
        refresh_token: config.value.refresh_token,
      }),
      {
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }
    );
  } catch (e: unknown | AxiosError) {
    if (axios.isAxiosError(e)) {
      return e.response;
    }
    return e;
  }
}
