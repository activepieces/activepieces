import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, CheckCircle } from 'lucide-react';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  LIMIT_QUERY_PARAM,
  CURSOR_QUERY_PARAM,
} from '@/components/ui/data-table';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { toast } from '@/components/ui/use-toast';
import { issuesApi } from '@/features/issues/api/issues-api';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import {
  ApEdition,
  ApFlagId,
  FlowRunStatus,
  Permission,
} from '@activepieces/shared';

import { issuesTableColumns } from './columns';

export function IssuesTable() {
  const navigate = useNavigate();
  const { refetch } = issueHooks.useIssuesNotification();
  const { data: edition } = flagsHooks.useFlag(ApFlagId.EDITION);
  const isEditionSupported = [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(
    edition as ApEdition,
  );
  const [searchParams] = useSearchParams();
  const projectId = authenticationSession.getProjectId()!;
  const { data, isLoading } = useQuery({
    queryKey: ['issues', searchParams.toString(), projectId],
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;
      return issuesApi.list({
        projectId,
        cursor: cursor ?? undefined,
        limit,
      });
    },
  });

  const handleMarkAsResolved = async (
    flowDisplayName: string,
    issueId: string,
  ) => {
    await issuesApi.resolve(issueId);
    refetch();
    toast({
      title: t('Success'),
      description: t('Issues in {flowDisplayName} is marked as resolved.', {
        flowDisplayName,
      }),
      duration: 3000,
    });
  };
  const { checkAccess } = useAuthorization();
  const openNewWindow = useNewWindow();
  const userHasPermissionToMarkAsResolved = checkAccess(
    Permission.WRITE_ISSUES,
  );

  const userHasPermissionToSeeRuns = checkAccess(Permission.READ_RUN);
  const handleRowClick = ({
    newWindow,
    flowId,
    created,
  }: {
    newWindow: boolean;
    flowId: string;
    created: string;
  }) => {
    const searchParams = createSearchParams({
      flowId: flowId,
      createdAfter: created,
      status: [
        FlowRunStatus.FAILED,
        FlowRunStatus.INTERNAL_ERROR,
        FlowRunStatus.TIMEOUT,
      ],
    }).toString();
    const pathname = authenticationSession.appendProjectRoutePrefix('/runs');
    if (newWindow) {
      openNewWindow(pathname, searchParams);
    } else {
      navigate({
        pathname,
        search: searchParams,
      });
    }
  };
  return (
    <LockedFeatureGuard
      featureKey="ISSUES"
      locked={!isEditionSupported}
      lockTitle={t('Unlock Issues')}
      lockDescription={t(
        'Track issues in your workflows and troubleshoot them.',
      )}
    >
      <div className="flex-col w-full">
        <DataTable
          emptyStateTextTitle={t('No issues found')}
          emptyStateTextDescription={t(
            'All your workflows are running smoothly.',
          )}
          emptyStateIcon={<CheckCircle className="size-14" />}
          page={data}
          isLoading={isLoading}
          columns={issuesTableColumns}
          bulkActions={[
            {
              render: (selectedRows, resetSelection) => {
                return (
                  <div className="flex items-center gap-2">
                    <PermissionNeededTooltip
                      hasPermission={userHasPermissionToMarkAsResolved}
                    >
                      <Button
                        disabled={!userHasPermissionToMarkAsResolved}
                        className="gap-2"
                        size={'sm'}
                        onClick={(e) => {
                          selectedRows.forEach((row) => {
                            handleMarkAsResolved(row.flowDisplayName, row.id);
                            row.delete();
                          });
                          resetSelection();
                        }}
                      >
                        <Check className="size-3" />
                        {t('Mark as Resolved')}{' '}
                        {selectedRows.length === 0
                          ? ''
                          : `(${selectedRows.length})`}
                      </Button>
                    </PermissionNeededTooltip>
                  </div>
                );
              },
            },
          ]}
          onRowClick={
            userHasPermissionToSeeRuns
              ? (row, newWindow) =>
                  handleRowClick({
                    newWindow,
                    flowId: row.flowId,
                    created: row.created,
                  })
              : undefined
          }
        />
      </div>
    </LockedFeatureGuard>
  );
}
