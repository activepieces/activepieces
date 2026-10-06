import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import type { HttpRequest } from '@activepieces/pieces-common';

export class GoogleTranslateApiError extends Error {
  readonly status: number;
  readonly googleStatus: string | undefined;

  constructor({ status, googleStatus, detail }: GoogleTranslateApiErrorParams) {
    super(`Google Translate API returned ${status}${googleStatus ? ` (${googleStatus})` : ''}: ${detail}`);
    this.name = 'GoogleTranslateApiError';
    this.status = status;
    this.googleStatus = googleStatus;
  }

  static fromHttpError(error: HttpError): GoogleTranslateApiError {
    const { status, body } = error.response;
    const googleError = readGoogleError(body);
    const detail =
      googleError?.message ??
      (typeof body === 'string' ? body : JSON.stringify(body ?? null));
    return new GoogleTranslateApiError({ status, googleStatus: googleError?.status, detail });
  }
}

export const GoogleTranslateApi = {
  async translate({ accessToken, q, target, source, format, model }: TranslateParams): Promise<Translation[]> {
    const body = await send<TranslateResponse>({
      accessToken,
      request: {
        method: HttpMethod.POST,
        url: TRANSLATE_V2_URL,
        body: {
          q,
          target,
          ...(source !== undefined ? { source } : {}),
          format: format ?? 'text',
          ...(model !== undefined ? { model } : {}),
        },
      },
    });
    return body.data.translations;
  },

  async detect({ accessToken, q }: DetectParams): Promise<Detection[]> {
    const body = await send<DetectResponse>({
      accessToken,
      request: {
        method: HttpMethod.POST,
        url: `${TRANSLATE_V2_URL}/detect`,
        body: { q },
      },
    });
    return body.data.detections
      .map((candidates) => candidates[0])
      .filter((detection): detection is Detection => detection !== undefined);
  },

  async languages({ accessToken, target = 'en' }: LanguagesParams): Promise<SupportedLanguage[]> {
    const body = await send<LanguagesResponse>({
      accessToken,
      request: {
        method: HttpMethod.GET,
        url: `${TRANSLATE_V2_URL}/languages`,
        queryParams: { target },
      },
    });
    return body.data.languages;
  },
};

async function send<T>({ accessToken, request }: SendParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      ...request,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: accessToken },
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw GoogleTranslateApiError.fromHttpError(error);
    }
    throw error;
  }
}

function readGoogleError(body: unknown): GoogleErrorDetail | undefined {
  if (!isRecord(body)) {
    return undefined;
  }
  const error = body['error'];
  if (!isRecord(error)) {
    return undefined;
  }
  const message = error['message'];
  const status = error['status'];
  return {
    message: typeof message === 'string' ? message : undefined,
    status: typeof status === 'string' ? status : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const TRANSLATE_API_ROOT = 'https://translation.googleapis.com';
export const TRANSLATE_V2_URL = `${TRANSLATE_API_ROOT}/language/translate/v2`;

export type TranslateFormat = 'text' | 'html';

export type Translation = {
  translatedText: string;
  detectedSourceLanguage?: string;
  model?: string;
};

export type Detection = {
  language: string;
  confidence?: number;
  isReliable?: boolean;
};

export type SupportedLanguage = {
  language: string;
  name?: string;
};

export type TranslateParams = {
  accessToken: string;
  q: string | string[];
  target: string;
  source?: string;
  format?: TranslateFormat;
  model?: string;
};

type DetectParams = {
  accessToken: string;
  q: string | string[];
};

type LanguagesParams = {
  accessToken: string;
  target?: string;
};

type SendParams = {
  accessToken: string;
  request: Omit<HttpRequest, 'authentication'>;
};

type GoogleTranslateApiErrorParams = {
  status: number;
  googleStatus: string | undefined;
  detail: string;
};

type GoogleErrorDetail = {
  message: string | undefined;
  status: string | undefined;
};

type TranslateResponse = { data: { translations: Translation[] } };
type DetectResponse = { data: { detections: Detection[][] } };
type LanguagesResponse = { data: { languages: SupportedLanguage[] } };
