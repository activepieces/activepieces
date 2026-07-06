import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './constants';

async function fetchModels({
  apiKey,
}: {
  apiKey: string;
}): Promise<ModelsResponse> {
  const response = await httpClient.sendRequest<ModelsResponse>({
    method: HttpMethod.GET,
    url: BASE_URL + '/models',
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });
  return response.body;
}

function toOptions({ models }: { models: DeepgramModel[] }): ModelOption[] {
  return models
    .map((model) => ({
      label: model.canonical_name,
      value: model.canonical_name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function fetchSttModelOptions({
  apiKey,
}: {
  apiKey: string;
}): Promise<ModelOption[]> {
  const body = await fetchModels({ apiKey });
  return toOptions({ models: body.stt ?? [] });
}

async function fetchTtsModelOptions({
  apiKey,
}: {
  apiKey: string;
}): Promise<ModelOption[]> {
  const body = await fetchModels({ apiKey });
  return toOptions({ models: body.tts ?? [] });
}

export const deepgramModels = { fetchSttModelOptions, fetchTtsModelOptions };

type DeepgramModel = {
  name: string;
  canonical_name: string;
};

type ModelsResponse = {
  stt?: DeepgramModel[];
  tts?: DeepgramModel[];
};

type ModelOption = {
  label: string;
  value: string;
};
