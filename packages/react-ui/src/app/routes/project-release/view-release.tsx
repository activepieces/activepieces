import { useQuery } from '@tanstack/react-query';
import { formatDistance } from 'date-fns';
import { t } from 'i18next';
import {
  ChevronRight,
  GitBranch,
  FolderOpenDot,
  RotateCcw,
} from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { isNil, ProjectReleaseType } from '@activepieces/shared';

import { ApplyButton } from './apply-plan';

const getReleaseSummaryType = (type: ProjectReleaseType) => {
  switch (type) {
    case ProjectReleaseType.GIT:
      return (
        <span className="flex items-center gap-1">
          <GitBranch className="size-4" /> {t('Git')}
        </span>
      );
    case ProjectReleaseType.PROJECT:
      return (
        <span className="flex items-center gap-1">
          <FolderOpenDot className="size-4" /> {t('Project')}
        </span>
      );
    case ProjectReleaseType.ROLLBACK:
      return (
        <span className="flex items-center gap-1">
          <RotateCcw className="size-4" /> {t('Rollback')}
        </span>
      );
  }
};

const ViewRelease = () => {
  const { releaseId } = useParams();
  const navigate = useNavigate();
  const { data: release, isLoading } = useQuery({
    queryKey: ['release', releaseId],
    queryFn: () => projectReleaseApi.get(releaseId || ''),
    enabled: !!releaseId,
  });

  if (!releaseId) {
    return <Navigate to="/releases" replace />;
  }

  if (!isLoading && isNil(release)) {
    return <Navigate to="/404" replace />;
  }

  const createdDate = new Date(release?.created ?? 0);
  const timeAgo = formatDistance(createdDate, new Date(), { addSuffix: true });

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="link"
            className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
            onClick={() => navigate('/releases')}
          >
            {t('Releases')}
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span>{release?.name}</span>
        </div>
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col items-start gap-2 w-full">
            <div className="flex items-center gap-2 text-md justify-between w-full">
              <h1 className="text-3xl font-bold">{release?.name}</h1>
              <div className="flex items-center justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ApplyButton
                      onSuccess={() => {
                        navigate('/releases');
                      }}
                      variant="ghost"
                      className="size-8 p-0"
                      request={{
                        type: ProjectReleaseType.ROLLBACK,
                        projectReleaseId: release?.id || '',
                      }}
                      defaultName={release?.name}
                    >
                      <Button disabled={isLoading}>{t('Rollback')}</Button>
                    </ApplyButton>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('Rollback')}</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('Created')}: {timeAgo}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-md font-semibold">{t('Summary')}</span>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex flex-col items-start gap-2">
            {release?.importedBy ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center flex-row gap-1">
                      {t('Imported by')}
                      <span className="font-semibold text-md">
                        {release?.importedByUser?.firstName}{' '}
                        {release?.importedByUser?.lastName}
                      </span>
                      {t('from')}{' '}
                      {getReleaseSummaryType(
                        release?.type ?? ProjectReleaseType.GIT,
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{release?.importedByUser?.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <span className="text-md font-semibold">{t('Description')}</span>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex flex-col items-start gap-2">
            <pre className="whitespace-pre-wrap">
              {release?.description || t('No description provided')}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewRelease;
