import { SeekPage } from '@activepieces/core-utils';
import { ProjectType, ProjectWithLimits } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { StatusCodes } from 'http-status-codes';
import { t } from 'i18next';
import { jwtDecode } from 'jwt-decode';
import {
  CheckCircle,
  FolderKanban,
  Lock,
  TriangleAlert,
  Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AuthCard, AuthPage } from '@/features/authentication';
import { MultiSelectFilter } from '@/features/automations/components/multi-select-filter';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';

import { PermissionItem } from './permission-item';

function McpAuthorizePage() {
  const [searchParams] = useSearchParams();
  const authRequestId = searchParams.get('authRequestId');
  const { clientName, isPlatformScoped, expiresAt } =
    decodeJwtPayload(authRequestId);
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(undefined);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [requestExpired, setRequestExpired] = useState(
    expiresAt !== null && expiresAt * 1000 <= Date.now(),
  );
  const [requestRejected, setRequestRejected] = useState(false);
  const debouncedSetSearchValue = useDebouncedCallback(setSearchValue, 300);
  const markRejectedOnInvalidRequest = (error: unknown) => {
    if (
      api.isError(error) &&
      error.response?.status === 400 &&
      (error.response.data as { error?: string } | undefined)?.error ===
        'invalid_request'
    ) {
      setRequestRejected(true);
    }
  };
  const isLoggedIn =
    authenticationSession.isLoggedIn() && !authenticationSession.isOnboarding();
  const currentUserId = authenticationSession.getCurrentUserId();
  const signInPath = `/sign-in?${new URLSearchParams({
    [FROM_QUERY_PARAM]: `/mcp-authorize?${searchParams.toString()}`,
  }).toString()}`;
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
    enabled: isLoggedIn && !!authRequestId && !isPlatformScoped,
  });

  const { data: currentUser } = userHooks.useUserById(
    isLoggedIn ? currentUserId : null,
  );

  useEffect(() => {
    if (expiresAt === null || requestExpired) {
      return;
    }
    const timer = setTimeout(
      () => setRequestExpired(true),
      Math.max(expiresAt * 1000 - Date.now(), 0),
    );
    return () => clearTimeout(timer);
  }, [expiresAt, requestExpired]);

  useEffect(() => {
    const projects = projectsPage?.data ?? [];
    if (!selectedProjectId && projects.length === 1 && !searchValue) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projectsPage?.data, selectedProjectId, searchValue]);

  const approveMutation = useMutation({
    mutationFn: (body: { authRequestId: string; projectId?: string }) =>
      api.post<{ redirectUrl: string }>('/v1/mcp-oauth/approve', body),
    onSuccess: (data) => {
      window.location.href = data.redirectUrl;
      setAuthorized(true);
    },
    onError: markRejectedOnInvalidRequest,
  });

  const denyMutation = useMutation({
    mutationFn: (body: { authRequestId: string }) =>
      api.post<{ redirectUrl: string }>('/v1/mcp-oauth/deny', body),
    onSuccess: (data) => {
      window.location.href = data.redirectUrl;
    },
    onError: markRejectedOnInvalidRequest,
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
    return <Navigate to={signInPath} replace />;
  }

  const switchAccount = () => {
    authenticationSession.clearSession();
    window.location.href = signInPath;
  };

  const handleAuthorize = () => {
    if (!isPlatformScoped && !selectedProjectId) return;
    approveMutation.mutate({
      authRequestId,
      ...(selectedProjectId && { projectId: selectedProjectId }),
    });
  };

  if (authorized) {
    return (
      <AuthPage>
        <AuthCard>
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-success-3 text-success-11">
              <CheckCircle className="size-4" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold text-gray-12">
                {t('Connected')}
              </h1>
              <p className="text-sm text-gray-11">
                <span className="font-medium text-gray-12">{clientName}</span>{' '}
                {isPlatformScoped
                  ? t('is now connected to your platform.')
                  : t('is now connected to your project.')}
              </p>
            </div>
          </div>
          <Separator />
          <p className="text-sm text-gray-11">
            {t('You can close this tab and return to the application.')}
          </p>
        </AuthCard>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthCard
        title={t('Authorize Application')}
        description={
          <>
            <span className="font-medium text-gray-12">{clientName}</span>{' '}
            {t('wants to connect to your Activepieces account')}
          </>
        }
      >
        {currentUser && (
          <p className="text-sm text-gray-11">
            {t('Signed in as {email}', { email: currentUser.email })}
            <span className="px-1.5">·</span>
            <button
              type="button"
              className="underline underline-offset-2 hover:text-gray-12"
              onClick={switchAccount}
            >
              {t('Switch account')}
            </button>
          </p>
        )}
        <div className="flex flex-col gap-2">
          <PermissionItem
            icon={<Workflow />}
            text={t('Build, test, and manage automations')}
          />
          <PermissionItem
            icon={<Lock />}
            text={t('Use connections and execute flows')}
          />
        </div>
        <Separator />
        {!isPlatformScoped && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
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
                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <span className="truncate">{project.displayName}</span>
                    <Badge variant="outline" className="shrink-0">
                      {project.type === ProjectType.PERSONAL
                        ? t('Personal')
                        : t('Team')}
                    </Badge>
                  </div>
                );
              }}
            />
          </div>
        )}
        {(requestExpired ||
          requestRejected ||
          approveMutation.isError ||
          denyMutation.isError) && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>
              {requestRejected ||
              (requestExpired &&
                !approveMutation.isError &&
                !denyMutation.isError)
                ? t(
                    'This request has expired. Go back to {client} and start the connection again.',
                    { client: clientName },
                  )
                : authorizeFailureMessage(approveMutation.error)}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            loading={denyMutation.isPending}
            disabled={requestRejected}
            onClick={() => denyMutation.mutate({ authRequestId })}
          >
            {t('Deny')}
          </Button>
          <Button
            type="button"
            className="flex-1"
            loading={approveMutation.isPending}
            disabled={
              requestRejected || (!isPlatformScoped && !selectedProjectId)
            }
            onClick={handleAuthorize}
          >
            {t('Authorize')}
          </Button>
        </div>
      </AuthCard>
    </AuthPage>
  );
}

function decodeJwtPayload(token: string | null): AuthRequestSummary {
  const fallback: AuthRequestSummary = {
    clientName: t('Unknown app'),
    isPlatformScoped: false,
    expiresAt: null,
  };
  try {
    if (!token) {
      return fallback;
    }
    const payload = jwtDecode<{
      clientName?: string;
      resource?: string;
      exp?: number;
    }>(token);
    return {
      clientName: payload.clientName ?? t('Unknown app'),
      isPlatformScoped: payload.resource?.endsWith('/mcp/platform') ?? false,
      expiresAt: payload.exp ?? null,
    };
  } catch {
    return fallback;
  }
}

function authorizeFailureMessage(error: unknown): string {
  if (api.isError(error) && error.response?.status === StatusCodes.FORBIDDEN) {
    return t(
      'You do not have MCP access here. Pick another project, or ask a platform admin for access.',
    );
  }
  return t('Authorization failed. Please try again.');
}

type AuthRequestSummary = {
  clientName: string;
  isPlatformScoped: boolean;
  expiresAt: number | null;
};

export { McpAuthorizePage };
