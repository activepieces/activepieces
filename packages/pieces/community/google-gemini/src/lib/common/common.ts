import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { googleGeminiAuth } from '../auth';

export const defaultLLM = 'gemini-1.5-flash';

export const allowedLLMs = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3-pro'
];

const isAllowedLLM = (model: GeminiModel): boolean =>
  allowedLLMs.some((allowed) => model.name.startsWith(`models/${allowed}`));

const isTtsModel = (model: GeminiModel): boolean =>
  model.name.toLowerCase().includes('tts') ||
  (model.displayName?.toLowerCase().includes('tts') ?? false);

const isVeoModel = (model: GeminiModel): boolean =>
  model.name.toLowerCase().includes('veo');

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
    const { body } = await httpClient.sendRequest<GeminiListModelsResponse>({
      method: HttpMethod.GET,
      url: `https://generativelanguage.googleapis.com/v1beta/models?key=${auth.secret_text}`,
    });
    const options = body.models.filter(filter).map((model) => ({
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
  fetchModelOptions({ auth, filter: isAllowedLLM });

export const getGeminiTtsModelOptions = async ({ auth }: { auth?: GeminiAuth }) =>
  fetchModelOptions({ auth, filter: isTtsModel });

export const getGeminiVideoModelOptions = async ({
  auth,
}: {
  auth?: GeminiAuth;
}) => fetchModelOptions({ auth, filter: isVeoModel });

type GeminiAuth = AppConnectionValueForAuthProperty<typeof googleGeminiAuth>;

type GeminiModel = {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
};

type GeminiListModelsResponse = {
  models: GeminiModel[];
};
