import {
  httpClient,
  HttpMethod,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { googleGeminiAuth } from '../auth';

const nonTextModelMarkers = [
  'nano-banana',
  'live',
  'native-audio',
  'transcribe',
  'robotics',
  'omni',
  'computer-use',
];

const isTtsModel = (model: GeminiModel): boolean =>
  model.name.toLowerCase().includes('tts') ||
  (model.displayName?.toLowerCase().includes('tts') ?? false);

const isVeoModel = (model: GeminiModel): boolean =>
  model.name.toLowerCase().includes('veo');

const isImageModel = (model: GeminiModel): boolean =>
  model.name.toLowerCase().includes('image') &&
  !model.name.toLowerCase().includes('imagen') &&
  !isTtsModel(model) &&
  !isVeoModel(model);

const isEmbeddingModel = (model: GeminiModel): boolean =>
  model.name.toLowerCase().includes('embedding');

const isTextModel = (model: GeminiModel): boolean =>
  model.name.startsWith('models/gemini-') &&
  (model.supportedGenerationMethods?.includes('generateContent') ?? false) &&
  !isTtsModel(model) &&
  !isImageModel(model) &&
  !isVeoModel(model) &&
  !isEmbeddingModel(model) &&
  !nonTextModelMarkers.some((marker) =>
    `-${model.name.replace('models/', '').toLowerCase()}-`.includes(
      `-${marker}-`,
    ),
  );

export const listAllModels = async ({
  auth,
}: {
  auth: GeminiAuth;
}): Promise<GeminiModel[]> => {
  const models: GeminiModel[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const queryParams: QueryParams = {
      key: auth.secret_text,
      pageSize: '1000',
    };
    if (pageToken) {
      queryParams['pageToken'] = pageToken;
    }

    const { body }: HttpResponse<GeminiListModelsResponse> =
      await httpClient.sendRequest<GeminiListModelsResponse>({
        method: HttpMethod.GET,
        url: 'https://generativelanguage.googleapis.com/v1beta/models',
        queryParams,
      });
    models.push(...(body.models ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);

  return models;
};

const fetchModelOptions = async ({
  auth,
  filter,
}: {
  auth?: GeminiAuth;
  filter: (model: GeminiModel) => boolean;
}) => {
  if (!auth) {
    return {
      disabled: true,
      placeholder: 'Enter your API key first',
      options: [],
    };
  }

  try {
    const models = await listAllModels({ auth });
    const options = models.filter(filter).map((model) => ({
      label: model.displayName ?? model.name.replace('models/', ''),
      value: model.name.replace('models/', ''),
    }));

    return {
      disabled: false,
      options,
    };
  } catch {
    return {
      disabled: true,
      options: [],
      placeholder: "Couldn't load models, check your API key or try again.",
    };
  }
};

export const getGeminiModelOptions = async ({ auth }: { auth?: GeminiAuth }) =>
  fetchModelOptions({ auth, filter: isTextModel });

export const getGeminiTtsModelOptions = async ({ auth }: { auth?: GeminiAuth }) =>
  fetchModelOptions({ auth, filter: isTtsModel });

export const getGeminiVideoModelOptions = async ({
  auth,
}: {
  auth?: GeminiAuth;
}) => fetchModelOptions({ auth, filter: isVeoModel });

export const getGeminiImageModelOptions = async ({
  auth,
}: {
  auth?: GeminiAuth;
}) => fetchModelOptions({ auth, filter: isImageModel });

export const getGeminiEmbeddingModelOptions = async ({
  auth,
}: {
  auth?: GeminiAuth;
}) => fetchModelOptions({ auth, filter: isEmbeddingModel });

export const defaultLLM = 'gemini-3.5-flash';

type GeminiAuth = AppConnectionValueForAuthProperty<typeof googleGeminiAuth>;

export type GeminiModel = {
  name: string;
  displayName?: string;
  description?: string;
  version?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
};

type GeminiListModelsResponse = {
  models?: GeminiModel[];
  nextPageToken?: string;
};
