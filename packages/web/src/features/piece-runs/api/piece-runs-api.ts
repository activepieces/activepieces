import { SeekPage } from '@activepieces/core-utils';
import { ListPieceRunsRequestQuery, PieceRun } from '@activepieces/shared';

import { api } from '@/lib/api';

export const pieceRunsApi = {
  list(request: ListPieceRunsRequestQuery): Promise<SeekPage<PieceRun>> {
    return api.get<SeekPage<PieceRun>>('/v1/piece-runs', request);
  },
  get(id: string): Promise<PieceRun> {
    return api.get<PieceRun>(`/v1/piece-runs/${id}`);
  },
};
