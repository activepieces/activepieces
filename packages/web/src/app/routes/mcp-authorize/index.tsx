import { ProjectType, ProjectWithLimits, SeekPage } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { jwtDecode } from 'jwt-decode';
import { Blocks, FolderKanban, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

import { FullLogo } from '@/components/custom/full-logo';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MultiSelectFilter } from '@/features/automations/components/multi-select-filter';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

function McpAuthorizePage() {
  const [searchParams] = useSearchParams();
  const authRequestId = searchParams.get('authRequestId');
  const clientName = decodeJwtClientName(authRequestId);
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(undefined);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const debouncedSetSearchValue = useDebouncedCallback(setSearchValue, 300);
  const isLoggedIn = authenticationSession.isLoggedIn();
  const projectTypeOptions = [
    { value: ProjectType.TEAM, label: t('Team') },
    { value: ProjectType.PERSONAL, label: t('Personal') },
  ];

  const { data: projectsPage, isLoading: projectsLoading } = useQuery({
    queryKey: ['mcp-authorize-projects', searchValue, selectedTypes],
    queryFn: () =>
      api.get<SeekPage<ProjectWithLimits>>('/v1/projects', {
        limit: 1000,
        ...(searchValue && { displayName: searchValue }),
        ...(selectedTypes.length > 0 && { types: selectedTypes }),
      }),
    enabled: isLoggedIn && !!authRequestId,
  });

  const approveMutation = useMutation({
    mutationFn: (body: { authRequestId: string; projectId: string }) =>
      api.post<{ redirectUrl: string }>('/v1/mcp-oauth/approve', body),
    onSuccess: (data) => {
      window.location.href = data.redirectUrl;
    },
  });

  const { projectsMap, options } = useMemo(() => {
    const list = projectsPage?.data ?? [];
    return {
      projectsMap: new Map(list.map((p) => [p.id, p])),
      options: list.map((p) => ({ value: p.id, label: p.displayName })),
    };
  }, [projectsPage?.data]);

  if (!authRequestId) {
    return <Navigate to="/404" replace />;
  }

  if (!isLoggedIn) {
    const returnUrl = `/mcp-authorize?${searchParams.toString()}`;
    const loginParams = new URLSearchParams({ from: returnUrl });
    return <Navigate to={`/sign-in?${loginParams.toString()}`} replace />;
  }

  const handleAuthorize = () => {
    if (!selectedProjectId) return;
    approveMutation.mutate({
      authRequestId,
      projectId: selectedProjectId,
    });
  };

  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-4 px-4">
      <FullLogo />
      <Card className="w-full max-w-md rounded-sm drop-shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">
            {t('Authorize Application')}
          </CardTitle>
          <CardDescription className="pt-1">
            <span className="font-semibold text-foreground">{clientName}</span>{' '}
            {t('wants to access your Activepieces account')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Blocks className="h-4 w-4 shrink-0" />
              <span>
                {t(
                  'This will allow the app to execute automations and access tools in your selected project.',
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t('Select Project')}
              </label>
              <MultiSelectFilter
                label={t('Type')}
                icon={<FolderKanban className="size-4" />}
                options={projectTypeOptions}
                selectedValues={selectedTypes}
                onChange={setSelectedTypes}
              />
            </div>
            <SearchableSelect<string>
              options={options}
              onChange={(value) => setSelectedProjectId(value ?? undefined)}
              value={selectedProjectId}
              placeholder={t('Search projects...')}
              disabled={projectsLoading}
              loading={projectsLoading}
              refreshOnSearch={debouncedSetSearchValue}
              valuesRendering={(value) => {
                const project = projectsMap.get(String(value));
                if (!project) return null;
                return (
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="truncate">{project.displayName}</span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {project.type === ProjectType.PERSONAL
                        ? t('Personal')
                        : t('Team')}
                    </Badge>
                  </div>
                );
              }}
            />
          </div>

          {approveMutation.isError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {t('Authorization failed. Please try again.')}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => window.history.back()}
            >
              {t('Deny')}
            </Button>
            <Button
              type="button"
              className="flex-1"
              loading={approveMutation.isPending}
              disabled={!selectedProjectId}
              onClick={handleAuthorize}
            >
              {t('Authorize')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function decodeJwtClientName(token: string | null): string {
  try {
    if (!token) return t('Unknown app');
    const payload = jwtDecode<{ clientName?: string }>(token);
    return payload.clientName ?? t('Unknown app');
  } catch {
    return t('Unknown app');
  }
}

export { McpAuthorizePage };
