// Stub for removed platform-admin feature
import { api } from '@/lib/api';
import { Tag, SeekPage } from '@activepieces/shared';

export const piecesTagsApi = {
  list: (_params?: { limit?: number }) =>
    api.get<SeekPage<Tag>>('/v1/pieces/tags'),
  create: (_request: unknown) => api.post<Tag>('/v1/pieces/tags', {}),
  upsert: (_request: unknown) => api.post<Tag>('/v1/pieces/tags', {}),
  tagPieces: (_request: unknown) => api.post('/v1/pieces/tags/tag-pieces', {}),
};
