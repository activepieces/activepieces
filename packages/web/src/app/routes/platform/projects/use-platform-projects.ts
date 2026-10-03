import { SeekPage } from '@activepieces/core-utils';
import {
  ListProjectRequestForPlatformQueryParams,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { QueryClient, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export function usePlatformProjects({
  search,
  type,
  cursor,
  limit,
}: {
  search: string;
  type: ProjectType;
  cursor: string | undefined;
  limit: number;
}) {
  const request: ListProjectRequestForPlatformQueryParams = {
    displayName: search.trim().length > 0 ? search.trim() : undefined,
    types: [type],
    cursor,
    limit,
  };
  return useQuery({
    queryKey: [...PLATFORM_PROJECTS_QUERY_KEY, request],
    queryFn: () =>
      api.get<SeekPage<ProjectWithLimits>>('/v1/projects', request),
    placeholderData: (previous) => previous,
  });
}

export function refreshPlatformProjects(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: PLATFORM_PROJECTS_QUERY_KEY,
  });
}

export const PLATFORM_PROJECTS_QUERY_KEY = ['platform-projects'];
