import { HttpMethod } from '@activepieces/pieces-common';
import { hfHub } from './hub-client';

function getRepoTypeInfo(repoType: string): RepoTypeInfo {
  switch (repoType) {
    case 'model':
      return { apiSegment: 'models', resolvePrefix: '', singular: 'model' };
    case 'dataset':
      return { apiSegment: 'datasets', resolvePrefix: 'datasets/', singular: 'dataset' };
    case 'space':
      return { apiSegment: 'spaces', resolvePrefix: 'spaces/', singular: 'space' };
    default:
      throw new Error(`Unknown repository type '${repoType}'. Use one of: model, dataset, space.`);
  }
}

function splitRepoId(repoId: string): string[] {
  const segments = repoId
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter((segment) => segment.length > 0);
  if (segments.length < 1 || segments.length > 2) {
    throw new Error(
      `Invalid repository ID '${repoId}'. Use the 'namespace/name' form, for example 'openai-community/gpt2'.`
    );
  }
  return segments;
}

function encodeRepoId(repoId: string): string {
  return splitRepoId(repoId).map(encodeURIComponent).join('/');
}

function encodeRevision(revision: string | undefined): string {
  const value = revision?.trim();
  return encodeURIComponent(value && value.length > 0 ? value : 'main');
}

function encodeFilePath(path: string | undefined): string {
  return (path ?? '')
    .split('/')
    .filter((segment) => segment.length > 0)
    .map(encodeURIComponent)
    .join('/');
}

async function resolveRepoId({ token, repoType, repoId }: RepoRefParams): Promise<string> {
  const segments = splitRepoId(repoId);
  if (segments.length === 2) {
    return segments.join('/');
  }
  const { apiSegment } = getRepoTypeInfo(repoType);
  const response = await hfHub.request<{ id?: unknown }>({
    token,
    method: HttpMethod.GET,
    path: `/api/${apiSegment}/${encodeURIComponent(segments[0])}`,
  });
  const canonical = response.body?.id;
  if (typeof canonical !== 'string' || !canonical.includes('/')) {
    throw new Error(
      `Could not resolve the legacy repository ID '${repoId}' to its 'namespace/name' form. Pass the full ID instead.`
    );
  }
  return canonical;
}

async function repoApiPath({ token, repoType, repoId }: RepoRefParams): Promise<string> {
  const { apiSegment } = getRepoTypeInfo(repoType);
  const canonical = await resolveRepoId({ token, repoType, repoId });
  return `/api/${apiSegment}/${encodeRepoId(canonical)}`;
}

export const hfRepo = {
  getTypeInfo: getRepoTypeInfo,
  encodeRepoId,
  encodeRevision,
  encodeFilePath,
  resolveRepoId,
  apiPath: repoApiPath,
};

export type RepoTypeInfo = {
  apiSegment: 'models' | 'datasets' | 'spaces';
  resolvePrefix: '' | 'datasets/' | 'spaces/';
  singular: 'model' | 'dataset' | 'space';
};

type RepoRefParams = {
  token: string;
  repoType: string;
  repoId: string;
};
