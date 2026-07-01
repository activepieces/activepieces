import { SeekPage } from '@activepieces/core-utils';
import {
  AdhocRunSource,
  BulkArchiveAdhocRunsRequestBody,
  FlowRunStatus,
  PopulatedAdhocRun,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const adhocRunsApi = {
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
    source?: AdhocRunSource[];
    userId?: string[];
    createdAfter?: string;
    createdBefore?: string;
    includeArchived?: boolean;
  }): Promise<SeekPage<PopulatedAdhocRun>> {
    return api.get<SeekPage<PopulatedAdhocRun>>('/v1/adhoc-runs', {
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
  get({ id }: { id: string }): Promise<PopulatedAdhocRun> {
    return api.get<PopulatedAdhocRun>(`/v1/adhoc-runs/${id}`);
  },
  bulkArchive(request: BulkArchiveAdhocRunsRequestBody): Promise<void> {
    return api.post<void>('/v1/adhoc-runs/archive', request);
  },
};
