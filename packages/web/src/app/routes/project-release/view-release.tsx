import { isNil } from '@activepieces/core-utils';
import { ProjectReleaseType } from '@activepieces/shared';
import { formatDistance } from 'date-fns';
import { t } from 'i18next';
import { GitBranch, FolderOpenDot, RotateCcw } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { Page, PageHeader } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectReleaseQueries } from '@/features/project-releases';
import { authenticationSession } from '@/lib/authentication-session';

import { ApplyButton } from './apply-plan';

const getReleaseSummaryType = (type: ProjectReleaseType) => {
  switch (type) {
    case ProjectReleaseType.GIT:
      return (
        <span className="flex items-center gap-1 font-medium">
          <GitBranch className="size-4" /> {t('Git')}
        </span>
      );
    case ProjectReleaseType.PROJECT:
      return (
        <span className="flex items-center gap-1 font-medium">
          <FolderOpenDot className="size-4" /> {t('Project')}
        </span>
      );
    case ProjectReleaseType.ROLLBACK:
      return (
        <span className="flex items-center gap-1 font-medium">
          <RotateCcw className="size-4" /> {t('Rollback')}
        </span>
      );
  }
};

const ViewRelease = () => {
  const { releaseId } = useParams();
  const navigate = useNavigate();
  const { data: release, isLoading } = projectReleaseQueries.useProjectRelease(
    releaseId || '',
    !!releaseId,
  );

  if (!releaseId) {
    return <Navigate to="/releases" replace />;
  }

  if (!isLoading && isNil(release)) {
    return <Navigate to="/404" replace />;
  }

  const createdDate = new Date(release?.created ?? 0);
  const timeAgo = formatDistance(createdDate, new Date(), { addSuffix: true });

  return (
    <Page width="narrow">
      <PageHeader
        back={{ to: '/releases', label: t('Releases') }}
        title={release?.name}
        description={`${t('Created')}: ${timeAgo}`}
      >
        <ApplyButton
          onSuccess={() => {
            navigate('/releases');
          }}
          disabled={isLoading}
          request={{
            projectId: authenticationSession.getProjectId()!,
            type: ProjectReleaseType.ROLLBACK,
            projectReleaseId: release?.id || '',
          }}
          defaultName={release?.name}
        >
          {t('Rollback')}
        </ApplyButton>
      </PageHeader>

      <Panel title={t('Summary')}>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          release?.importedBy && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex w-fit flex-wrap items-center gap-1 text-sm">
                  {t('Imported by')}
                  <span className="font-medium">
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
          )
        )}
      </Panel>
      <Panel title={t('Description')}>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <pre className="font-sans text-sm whitespace-pre-wrap">
            {release?.description || t('No description provided')}
          </pre>
        )}
      </Panel>
    </Page>
  );
};

export default ViewRelease;
