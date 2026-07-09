import { SeekPage } from '@activepieces/core-utils';
import {
  PieceRunListItem,
  PieceRunSource,
  BulkArchivePieceRunsRequestBody,
  FlowRunStatus,
  PopulatedPieceRun,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const pieceRunsApi = {
  list({
    projectId,
    cursor,
    limit,
    status,
    source,
    userId,
    createdAfter,
    createdBefore,
    includeArchived,
  }: {
    projectId: string;
    cursor?: string;
    limit?: number;
    status?: FlowRunStatus[];
    source?: PieceRunSource[];
    userId?: string[];
    createdAfter?: string;
    createdBefore?: string;
    includeArchived?: boolean;
  }): Promise<SeekPage<PieceRunListItem>> {
    return api.get<SeekPage<PieceRunListItem>>('/v1/piece-runs', {
      projectId,
      cursor,
      limit,
      status,
      source,
      userId,
      createdAfter,
      createdBefore,
      includeArchived,
    });
  },
  get({ id }: { id: string }): Promise<PopulatedPieceRun> {
    return api.get<PopulatedPieceRun>(`/v1/piece-runs/${id}`);
  },
  bulkArchive(request: BulkArchivePieceRunsRequestBody): Promise<void> {
    return api.post<void>('/v1/piece-runs/archive', request);
  },
};
