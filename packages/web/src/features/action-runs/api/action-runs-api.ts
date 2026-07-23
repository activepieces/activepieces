import { SeekPage } from '@activepieces/core-utils';
import {
  ActionRunListItem,
  ActionRunSource,
  BulkArchiveActionRunsRequestBody,
  FlowRunStatus,
  PopulatedActionRun,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const actionRunsApi = {
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
    source?: ActionRunSource[];
    userId?: string[];
    createdAfter?: string;
    createdBefore?: string;
    includeArchived?: boolean;
  }): Promise<SeekPage<ActionRunListItem>> {
    return api.get<SeekPage<ActionRunListItem>>('/v1/action-runs', {
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
  get({
    id,
    includeArchived,
  }: {
    id: string;
    includeArchived?: boolean;
  }): Promise<PopulatedActionRun> {
    return api.get<PopulatedActionRun>(`/v1/action-runs/${id}`, {
      includeArchived,
    });
  },
  bulkArchive(request: BulkArchiveActionRunsRequestBody): Promise<void> {
    return api.post<void>('/v1/action-runs/archive', request);
  },
};
