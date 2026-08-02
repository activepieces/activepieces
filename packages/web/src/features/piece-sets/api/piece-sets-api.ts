import { SeekPage } from '@activepieces/core-utils';
import {
  AssignProjectsRequestBody,
  CreatePieceSetRequestBody,
  DuplicatePieceSetRequestBody,
  PieceSet,
  PieceSetConfig,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const pieceSetsApi = {
  list() {
    return api.get<SeekPage<PieceSet>>('/v1/piece-sets');
  },
  get(id: string) {
    return api.get<PieceSet>(`/v1/piece-sets/${id}`);
  },
  getCurrent(projectId: string) {
    return api.get<PieceSetConfig>('/v1/piece-sets/current', { projectId });
  },
  create(request: CreatePieceSetRequestBody) {
    return api.post<PieceSet>('/v1/piece-sets', request);
  },
  update(id: string, request: UpdatePieceSetRequestBody) {
    return api.post<PieceSet>(`/v1/piece-sets/${id}`, request);
  },
  delete(id: string) {
    return api.delete<void>(`/v1/piece-sets/${id}`);
  },
  duplicate(id: string, request: DuplicatePieceSetRequestBody) {
    return api.post<PieceSet>(`/v1/piece-sets/${id}/duplicate`, request);
  },
  assignProjects(id: string, request: AssignProjectsRequestBody) {
    return api.post<void>(`/v1/piece-sets/${id}/projects`, request);
  },
  removeProject(id: string, projectId: string) {
    return api.delete<void>(`/v1/piece-sets/${id}/projects/${projectId}`);
  },
};

export const pieceSetKeys = {
  all: ['piece-sets'] as const,
  one: (id: string) => ['piece-sets', id] as const,
  current: (projectId: string) => ['piece-sets', 'current', projectId] as const,
};
