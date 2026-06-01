import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { uxsniffAuth } from '../../';

const BASE_URL = 'https://api.uxsniff.com/v1';

async function uxsniffApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  queryParams,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | number | undefined>;
  body?: unknown;
}): Promise<HttpResponse<T>> {
  const cleanedQuery: QueryParams = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== '') {
        cleanedQuery[key] = String(value);
      }
    }
  }

  return await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: apiKey,
    },
    queryParams: cleanedQuery,
    body,
  });
}

function toEpochMillis(value: unknown): number {
  if (typeof value === 'number') {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber) && value.trim() !== '') {
      return asNumber < 1e12 ? asNumber * 1000 : asNumber;
    }
    const parsed = new Date(value).getTime();
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function startDateFromEpoch(epochMillis: number): string {
  return new Date(epochMillis - ONE_DAY_MS).toISOString().slice(0, 10);
}

const surveyDropdown = Property.Dropdown({
  displayName: 'Survey',
  description: 'Select the survey to read responses from.',
  auth: uxsniffAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your UXsniff account first',
      };
    }
    try {
      const response = await uxsniffApiCall<UxsniffSurvey[]>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: '/list-survey',
        queryParams: { limit: 200 },
      });
      const surveys = Array.isArray(response.body) ? response.body : [];
      if (surveys.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No surveys found. Create one in your UXsniff dashboard first.',
        };
      }
      return {
        disabled: false,
        options: surveys.map((survey) => ({
          label: `${survey.survey_name}${survey.active ? '' : ' (inactive)'}`,
          value: String(survey.survey_id),
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load surveys. Check your connection.',
      };
    }
  },
});

export const uxsniffCommon = {
  apiCall: uxsniffApiCall,
  toEpochMillis,
  startDateFromEpoch,
  surveyDropdown,
};

export type UxsniffSurvey = {
  survey_id: string | number;
  survey_name: string;
  active: boolean;
};

export type UxsniffVisitor = {
  visitor_id?: string;
  session_id?: string;
  email?: string;
  device?: string;
  country?: string;
  browser?: string;
  browserSize?: string;
  os?: string;
};

export type UxsniffFeedback = {
  feedback_id: string | number;
  question?: string;
  comment?: string;
  rating?: number | string;
  created?: string | number;
  url?: string;
  screenshot?: string;
  visitor?: UxsniffVisitor;
};

export type UxsniffSurveyResponse = {
  id: string | number;
  client_id?: string;
  sessio_id?: string;
  session_id?: string;
  answers?: unknown;
  url?: string;
  country?: string;
  countryName?: string;
  created?: string | number;
  os?: string;
  browser?: string;
  referrer?: string;
};
