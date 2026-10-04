import { SeekPage } from '@activepieces/core-utils';
import {
  AssignProjectsRequestBody,
  CreatePieceSetRequestBody,
  DuplicatePieceSetRequestBody,
  ListPieceSetsRequestQuery,
  PieceSet,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const pieceSetsApi = {
  list(request: Partial<ListPieceSetsRequestQuery> = {}) {
    return api.get<SeekPage<PieceSet>>('/v1/piece-sets', request);
  },
  async listAll(): Promise<PieceSet[]> {
    const sets: PieceSet[] = [];
    let cursor: string | undefined = undefined;
    do {
      const page: SeekPage<PieceSet> = await pieceSetsApi.list({
        cursor,
        limit: LIST_ALL_PAGE_SIZE,
      });
      sets.push(...page.data);
      cursor = page.next ?? undefined;
    } while (cursor !== undefined);
    return sets;
  },
  get(id: string) {
    return api.get<PieceSet>(`/v1/piece-sets/${id}`);
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

const LIST_ALL_PAGE_SIZE = 100;
