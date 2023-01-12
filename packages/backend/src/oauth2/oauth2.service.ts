import axios, { AxiosError } from "axios";
import qs from "qs";
import {
  ClaimTokenFromCloudRequest,
  ClaimTokenWithSecretRequest,
} from "shared";
import { formatOAuth2Response } from "../app-connection/app-connection-service";

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
            headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
          }
        )
      ).data;
      return formatOAuth2Response(response);
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
  }
};
