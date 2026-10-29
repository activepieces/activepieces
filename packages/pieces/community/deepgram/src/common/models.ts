import { HttpMethod } from '@activepieces/pieces-common';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from './client';

async function fetchModels({
  apiKey,
  projectId,
  includeOutdated,
}: {
  apiKey: string;
  projectId?: string;
  includeOutdated?: boolean;
}): Promise<ModelsResponse> {
  const response = await deepgramClient.request<ModelsResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: projectId
      ? `/projects/${encodeURIComponent(projectId)}/models`
      : '/models',
    query: { include_outdated: includeOutdated ? 'true' : undefined },
    timeoutMs: DEEPGRAM_TIMEOUTS.manage,
    operation: 'list models',
  });
  return response.body ?? {};
}

function dedupe({ models }: { models: DeepgramModel[] }): DeepgramModel[] {
  const byName = new Map<string, DeepgramModel>();
  for (const model of models) {
    if (!isUsable(model)) {
      continue;
    }
    const existing = byName.get(model.canonical_name);
    byName.set(
      model.canonical_name,
      existing ? merge({ current: existing, next: model }) : model
    );
  }
  return [...byName.values()];
}

function merge({
  current,
  next,
}: {
  current: DeepgramModel;
  next: DeepgramModel;
}): DeepgramModel {
  const newer =
    (next.version ?? '').localeCompare(current.version ?? '') > 0
      ? next
      : current;
  return {
    ...newer,
    languages: [
      ...new Set([...(current.languages ?? []), ...(next.languages ?? [])]),
    ],
    batch: Boolean(current.batch) || Boolean(next.batch),
    streaming: Boolean(current.streaming) || Boolean(next.streaming),
  };
}

function isUsable(model: DeepgramModel): boolean {
  const name = model.canonical_name;
  if (typeof name !== 'string' || name.length === 0) {
    return false;
  }
  return name !== 'phoneme' && !name.includes('dQw4w9WgXcQ');
}

function sttRank(name: string): number {
  if (name.startsWith('nova-3')) {
    return 0;
  }
  if (name.startsWith('nova-2')) {
    return 1;
  }
  return 2;
}

function sortStt(models: DeepgramModel[]): DeepgramModel[] {
  return [...models].sort(
    (a, b) =>
      sttRank(a.canonical_name) - sttRank(b.canonical_name) ||
      a.canonical_name.localeCompare(b.canonical_name)
  );
}

function sortTts(models: DeepgramModel[]): DeepgramModel[] {
  return [...models].sort(
    (a, b) =>
      ttsRank(a) - ttsRank(b) ||
      a.canonical_name.localeCompare(b.canonical_name)
  );
}

function ttsRank(model: DeepgramModel): number {
  return model.architecture === 'aura-2' ? 0 : 1;
}

function sttLabel(model: DeepgramModel): string {
  return model.architecture && model.architecture !== 'unknown'
    ? `${model.canonical_name} (${model.architecture})`
    : model.canonical_name;
}

function ttsLabel(model: DeepgramModel): string {
  const metadata = model.metadata ?? {};
  const name = metadata.display_name ?? capitalize(model.name ?? '');
  const family = model.architecture === 'aura-2' ? 'Aura-2' : 'Aura';
  const language = (model.languages ?? [])[0];
  const accent = metadata.accent;
  const gender = genderOf(model);
  const details = [
    family,
    language ? `${language}${accent ? ` (${accent})` : ''}` : accent,
    gender,
  ].filter(
    (item): item is string => typeof item === 'string' && item.length > 0
  );
  return name
    ? `${name} - ${details.join(', ')} [${model.canonical_name}]`
    : model.canonical_name;
}

function genderOf(model: DeepgramModel): string | null {
  const tags = model.metadata?.tags ?? [];
  if (tags.includes('feminine')) {
    return 'feminine';
  }
  if (tags.includes('masculine')) {
    return 'masculine';
  }
  return null;
}

function capitalize(text: string): string {
  return text.length > 0 ? text[0].toUpperCase() + text.slice(1) : text;
}

function toSttOptions({ models }: { models: DeepgramModel[] }): ModelOption[] {
  return sortStt(dedupe({ models }).filter((model) => model.batch)).map(
    (model) => ({ label: sttLabel(model), value: model.canonical_name })
  );
}

function toTtsOptions({ models }: { models: DeepgramModel[] }): ModelOption[] {
  return sortTts(dedupe({ models })).map((model) => ({
    label: ttsLabel(model),
    value: model.canonical_name,
  }));
}

async function fetchSttModelOptions({
  apiKey,
}: {
  apiKey: string;
}): Promise<ModelOption[]> {
  const body = await fetchModels({ apiKey });
  return toSttOptions({ models: body.stt ?? [] });
}

async function fetchTtsModelOptions({
  apiKey,
}: {
  apiKey: string;
}): Promise<ModelOption[]> {
  const body = await fetchModels({ apiKey });
  return toTtsOptions({ models: body.tts ?? [] });
}

function flattenModel({
  model,
  type,
}: {
  model: DeepgramModel;
  type: 'stt' | 'tts';
}): FlatModel {
  const metadata = model.metadata ?? {};
  return {
    canonical_name: model.canonical_name,
    type,
    name:
      type === 'tts'
        ? metadata.display_name ?? model.name ?? null
        : model.name ?? null,
    architecture: model.architecture ?? null,
    languages: (model.languages ?? []).join(', '),
    version: model.version ?? null,
    batch: type === 'stt' ? Boolean(model.batch) : null,
    streaming: type === 'stt' ? Boolean(model.streaming) : null,
    accent: metadata.accent ?? null,
    age: metadata.age ?? null,
    gender: genderOf(model),
    voice_tags: (metadata.tags ?? []).join(', '),
    sample_url: metadata.sample ?? null,
  };
}

function matchesLanguage({
  model,
  language,
}: {
  model: DeepgramModel;
  language: string;
}): boolean {
  const wanted = language.toLowerCase();
  return (model.languages ?? []).some((tag) => {
    const lower = tag.toLowerCase();
    return lower === wanted || lower.startsWith(`${wanted}-`);
  });
}

async function listModels({
  apiKey,
  projectId,
  type,
  language,
  includeOutdated,
}: {
  apiKey: string;
  projectId?: string;
  type: 'stt' | 'tts' | 'all';
  language?: string;
  includeOutdated?: boolean;
}): Promise<FlatModel[]> {
  const body = await fetchModels({ apiKey, projectId, includeOutdated });
  const wantedLanguage = language?.trim();
  const pick = (models: DeepgramModel[]) =>
    wantedLanguage
      ? models.filter((model) =>
          matchesLanguage({ model, language: wantedLanguage })
        )
      : models;
  const stt =
    type === 'tts'
      ? []
      : pick(sortStt(dedupe({ models: body.stt ?? [] }))).map((model) =>
          flattenModel({ model, type: 'stt' })
        );
  const tts =
    type === 'stt'
      ? []
      : pick(sortTts(dedupe({ models: body.tts ?? [] }))).map((model) =>
          flattenModel({ model, type: 'tts' })
        );
  return [...stt, ...tts];
}

async function listModelBuilds({
  apiKey,
  projectId,
  type,
  language,
  includeOutdated,
}: {
  apiKey: string;
  projectId?: string;
  type: 'stt' | 'tts' | 'all';
  language?: string;
  includeOutdated?: boolean;
}): Promise<FlatModelBuild[]> {
  const body = await fetchModels({ apiKey, projectId, includeOutdated });
  const wantedLanguage = language?.trim();
  const pick = (models: DeepgramModel[]) =>
    models
      .filter((model) => isUsable(model))
      .filter(
        (model) =>
          !wantedLanguage ||
          matchesLanguage({ model, language: wantedLanguage })
      );
  const stt =
    type === 'tts'
      ? []
      : sortStt(pick(body.stt ?? [])).map((model) =>
          flattenBuild({ model, type: 'stt' })
        );
  const tts =
    type === 'stt'
      ? []
      : sortTts(pick(body.tts ?? [])).map((model) =>
          flattenBuild({ model, type: 'tts' })
        );
  return [...stt, ...tts];
}

function flattenBuild({
  model,
  type,
}: {
  model: DeepgramModel;
  type: 'stt' | 'tts';
}): FlatModelBuild {
  return { uuid: model.uuid ?? '', ...flattenModel({ model, type }) };
}

async function getModel({
  apiKey,
  projectId,
  modelId,
}: {
  apiKey: string;
  projectId?: string;
  modelId: string;
}): Promise<FlatModelBuild> {
  const id = encodeURIComponent(modelId);
  const response = await deepgramClient.request<DeepgramModel>({
    apiKey,
    method: HttpMethod.GET,
    path: projectId
      ? `/projects/${encodeURIComponent(projectId)}/models/${id}`
      : `/models/${id}`,
    timeoutMs: DEEPGRAM_TIMEOUTS.manage,
    operation: 'get the model',
  });
  const model = response.body ?? { canonical_name: '' };
  const type =
    model.metadata !== undefined || /^aura/.test(model.canonical_name ?? '')
      ? 'tts'
      : 'stt';
  return {
    ...flattenBuild({ model, type }),
    uuid: model.uuid ?? modelId,
    canonical_name: model.canonical_name ?? '',
  };
}

export const deepgramModels = {
  listModelBuilds,
  getModel,
  fetchSttModelOptions,
  fetchTtsModelOptions,
  toSttOptions,
  toTtsOptions,
  listModels,
};

type DeepgramModel = {
  uuid?: string;
  name?: string;
  canonical_name: string;
  architecture?: string;
  languages?: string[];
  version?: string;
  batch?: boolean;
  streaming?: boolean;
  metadata?: {
    accent?: string | null;
    age?: string | null;
    display_name?: string | null;
    sample?: string | null;
    tags?: string[];
  };
};

type ModelsResponse = {
  stt?: DeepgramModel[];
  tts?: DeepgramModel[];
};

type ModelOption = {
  label: string;
  value: string;
};

export type FlatModel = {
  canonical_name: string;
  type: 'stt' | 'tts';
  name: string | null;
  architecture: string | null;
  languages: string;
  version: string | null;
  batch: boolean | null;
  streaming: boolean | null;
  accent: string | null;
  age: string | null;
  gender: string | null;
  voice_tags: string;
  sample_url: string | null;
};

export type FlatModelBuild = FlatModel & { uuid: string };
