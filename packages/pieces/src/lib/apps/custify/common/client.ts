import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { httpClient } from '../../../common/http/core/http-client';
import { HttpMethod } from '../../../common/http/core/http-method';
import { HttpRequest } from '../../../common/http/core/http-request';
import { CustifyAssignNpsRequest } from './models';

const API = 'https://api.custify.com';

export const custifyClient = {
  nps: {
    async assign({ apiKey, email, score, comment, submittedAt }: NpsAssignParams) {
      const request: HttpRequest<CustifyAssignNpsRequest> = {
        method: HttpMethod.POST,
        url: `${API}/nps_score`,
        queryParams: {
          email,
        },
        body: {
          score,
          comment,
          submittedAt,
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: apiKey,
        },
      }

      const response = await httpClient.sendRequest(request);
      return response.body;
    },
  },
};

type NpsAssignParams = {
  apiKey: string;
  email: string;
  score: number;
  comment?: string | undefined;
  submittedAt?: string | undefined;
};
