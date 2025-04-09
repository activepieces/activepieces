import { api } from '@/lib/api'
import { ListTagsRequest, SeekPage, SetPieceTagsRequest, Tag, UpsertTagRequest } from '@activepieces/shared'

export const piecesTagsApi = {
  upsert(tag: UpsertTagRequest) {
    return api.post<Tag>('/v1/tags', tag)
  },
  list(query: ListTagsRequest) {
    return api.get<SeekPage<Tag>>('/v1/tags', query)
  },
  tagPieces(request: SetPieceTagsRequest) {
    return api.post<void>('/v1/tags/pieces', request)
  },
}
