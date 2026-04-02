import { ProjectWithLimits, SeekPage } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { jwtDecode } from 'jwt-decode';
import { Blocks, Shield } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { FullLogo } from '@/components/custom/full-logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

function McpAuthorizePage() {
  const [searchParams] = useSearchParams();
  const authRequestId = searchParams.get('authRequestId');
  const clientName = decodeJwtClientName(authRequestId);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const isLoggedIn = authenticationSession.isLoggedIn();

  const { data: projectsPage, isLoading: projectsLoading } = useQuery({
    queryKey: ['mcp-authorize-projects'],
    queryFn: () =>
      api.get<SeekPage<ProjectWithLimits>>('/v1/projects', {
        params: { limit: 100 },
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

  if (!authRequestId) {
    return <Navigate to="/404" replace />;
  }

  if (!isLoggedIn) {
    const returnUrl = `/mcp-authorize?${searchParams.toString()}`;
    const loginParams = new URLSearchParams({ from: returnUrl });
    return <Navigate to={`/sign-in?${loginParams.toString()}`} replace />;
  }

  const projects = projectsPage?.data ?? [];

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
            <label className="text-sm font-medium">{t('Select Project')}</label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={projectsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    projectsLoading
                      ? t('Loading projects...')
                      : t('Choose a project')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
