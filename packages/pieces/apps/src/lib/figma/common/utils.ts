import { httpClient, HttpMethod, HttpRequest, AuthenticationType } from "@activepieces/framework";

export const figmaGetRequest = async ( { token, url }: FigmaGetRequestParams ) => {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: url,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };
    
      const response = await httpClient.sendRequest(request);
    
      return {
        success: true,
        request_body: request.body,
        response_body: response.body,
      };
  };

  export const figmaPostRequestWithMessage = async ( { token, url, message }: FigmaPostRequestWithMessageParams ) => {
    const request: HttpRequest<FigmaPostRequestWithMessageBody> = {
        method: HttpMethod.POST,
        url: url,
        body: {
            message: message,
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };
    
      const response = await httpClient.sendRequest(request);
    
      return {
        success: true,
        request_body: request.body,
        response_body: response.body,
      };
  };

  type FigmaGetRequestParams = {
    token: string;
    url: string;
  }

  type FigmaPostRequestWithMessageParams = {
    token: string;
    url: string;
    message: string;
  }

  type FigmaPostRequestWithMessageBody = {
    message: string;
  }