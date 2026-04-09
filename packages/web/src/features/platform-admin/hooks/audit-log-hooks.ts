import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { platformHooks } from '@/hooks/platform-hooks';

import { auditEventsApi } from '../api/audit-events-api';

export const auditLogKeys = {
  all: (searchParams: string) => ['audit-logs', searchParams] as const,
};

export const auditLogQueries = {
  useAuditLogs: () => {
    const [searchParams] = useSearchParams();
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: auditLogKeys.all(searchParams.toString()),
      staleTime: 0,
      gcTime: 0,
      enabled: platform.plan.auditLogEnabled,
      meta: { showErrorDialog: true },
      queryFn: async () => {
        const cursor = searchParams.get(CURSOR_QUERY_PARAM);
        const limit = searchParams.get(LIMIT_QUERY_PARAM);
        const action = searchParams.getAll('action');
        const projectId = searchParams.getAll('projectId');
        const userId = searchParams.get('userId');
        return auditEventsApi.list({
          cursor: cursor ?? undefined,
          limit: limit ? parseInt(limit) : undefined,
          action: action ?? undefined,
          projectId: projectId ?? undefined,
          userId: userId ?? undefined,
          createdBefore: searchParams.get('createdBefore') ?? undefined,
          createdAfter: searchParams.get('createdAfter') ?? undefined,
        });
      },
    });
  },
};
