import axios, {AxiosError} from 'axios';
import qs from 'qs';
import {ClaimTokenWithSecretRequest, CloudOAuth2Config, ConfigType, OAuth2Config} from "shared";

export const oauth2Service = {
    claim: async (request: ClaimTokenWithSecretRequest): Promise<unknown> => {
        try {
            return axios.post(request.tokenUrl,
                qs.stringify({
                    client_id: request.clientId,
                    client_secret: request.clientSecret,
                    redirect_uri: request.redirectUrl,
                    grant_type: 'authorization_code',
                    code: request.code
                }), {
                    headers: {'content-type': 'application/x-www-form-urlencoded'},
                });
        }catch (e: unknown | AxiosError){
            if(axios.isAxiosError(e)) {
                return e.response;
            }
            return e;
        }
    },
    refreshToken: async (request: CloudOAuth2Config | OAuth2Config): Promise<unknown> => {
        switch (request.type){
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
        return axios.post(config.value.tokenUrl,
            qs.stringify({
                client_id: config.value.clientId,
                client_secret: config.value.clientSecret,
                redirect_uri: config.value.redirectUrl,
                grant_type: 'refresh_token',
                refresh_token: config.value.response.refresh_token
            }), {
                headers: {'content-type': 'application/x-www-form-urlencoded'},
            });
    }catch (e: unknown | AxiosError){
        if(axios.isAxiosError(e)) {
            return e.response;
        }
        return e;
    }
}