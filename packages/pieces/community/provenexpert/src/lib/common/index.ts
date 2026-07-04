import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { provenExpertAuth } from './auth';

const BASE_URL = 'https://www.provenexpert.com/api/v1';

async function provenExpertApiCall<T extends HttpMessageBody>({
  auth,
  path,
  body,
}: {
  auth: { api_id: string; api_key: string };
  path: string;
  body?: Record<string, unknown>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.api_id,
      password: auth.api_key,
    },
    body: body ? { data: body } : {},
  });
}

const surveyDropdown = Property.Dropdown({
  auth: provenExpertAuth,
  displayName: 'Survey',
  description: 'Pick the survey to use. Surveys are created in your ProvenExpert account under the Surveys section.',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your ProvenExpert account first',
      };
    }
    try {
      const response = await provenExpertApiCall<{
        status: string;
        surveys: Record<
          string,
          { code: string; name: string; active: number }
        >;
      }>({
        auth: auth.props,
        path: '/survey/get',
      });
      const surveys = response.body.surveys ?? {};
      const options = Object.values(surveys).map((s) => ({
        label: s.active === 1 ? s.name : `${s.name} (inactive)`,
        value: s.code,
      }));
      if (options.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No surveys found. Create one in your ProvenExpert dashboard first.',
        };
      }
      return { disabled: false, options };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load surveys. Check your connection.',
      };
    }
  },
});

export const provenExpertCommon = {
  apiCall: provenExpertApiCall,
  surveyDropdown,
  baseUrl: BASE_URL,
};

export type ProvenExpertAuth = { api_id: string; api_key: string };
