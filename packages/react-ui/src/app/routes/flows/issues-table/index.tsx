import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, CheckCircle, CheckIcon } from 'lucide-react';
import { useMemo, useRef, useEffect } from 'react';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

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
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { FlowRunStatus, IssueStatus, Permission } from '@activepieces/shared';

import { issuesTableColumns } from './columns';

export function IssuesTable() {
  const navigate = useNavigate();
  const { refetch } = issueHooks.useIssuesNotification();

  const [searchParams] = useSearchParams();
  const projectId = authenticationSession.getProjectId()!;
  const prevSearchParamsRef = useRef<string>('');
  const currentSearchParams = searchParams.toString();

  const statusValues = searchParams.getAll('status');

  useEffect(() => {
    prevSearchParamsRef.current = currentSearchParams;
  }, [currentSearchParams]);

  const filters = useMemo(
    () => [
      {
        type: 'select',
        id: 'status',
        title: t('Status'),
        accessorKey: 'status',
        options: [
          {
            label: t('Unresolved'),
            value: IssueStatus.UNRESOLVED,
          },
          {
            label: t('Resolved'),
            value: IssueStatus.RESOLVED,
          },
          {
            label: t('Archived'),
            value: IssueStatus.ARCHIVED,
          },
        ],
        icon: CheckIcon,
      } as const,
    ],
    [],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['issues', currentSearchParams, projectId],
    staleTime: 0,
    gcTime: 0,
    enabled:
      prevSearchParamsRef.current === '' ||
      prevSearchParamsRef.current !== currentSearchParams,
    queryFn: (): Promise<any> => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;

      let status: IssueStatus[] | undefined;
      if (statusValues.length > 0) {
        status = statusValues
          .filter((value) =>
            Object.values(IssueStatus).includes(value as IssueStatus),
          )
          .map((value) => value as IssueStatus);
      }

      return issuesApi.list({
        projectId,
        cursor: cursor ?? undefined,
        limit,
        status,
      });
    },
  });

  const handleMarkAsArchived = async (
    flowDisplayName: string,
    issueId: string,
  ) => {
    await issuesApi.archive(issueId);
    refetch();
    toast({
      title: t('Success'),
      description: t('Issues in {flowDisplayName} is marked as archived.', {
        flowDisplayName,
      }),
      duration: 3000,
    });
  };
  const { checkAccess } = useAuthorization();
  const openNewWindow = useNewWindow();
  const userHasPermissionToMarkAsArchived = checkAccess(
    Permission.WRITE_ISSUES,
  );

  const userHasPermissionToSeeRuns = checkAccess(Permission.READ_RUN);
  const handleRowClick = ({
    newWindow,
    flowId,
    failedStepName,
  }: {
    newWindow: boolean;
    flowId: string;
    failedStepName?: string;
  }) => {
    const params: Record<string, string | string[]> = {
      flowId: flowId,
      status: [
        FlowRunStatus.FAILED,
        FlowRunStatus.INTERNAL_ERROR,
        FlowRunStatus.TIMEOUT,
      ],
    };

    if (failedStepName) {
      params.failedStepName = failedStepName;
    }

    const searchParams = createSearchParams(params).toString();
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
        filters={filters}
        bulkActions={[
          {
            render: (selectedRows, resetSelection) => {
              return (
                <div className="flex items-center gap-2">
                  <PermissionNeededTooltip
                    hasPermission={userHasPermissionToMarkAsArchived}
                  >
                    <Button
                      disabled={!userHasPermissionToMarkAsArchived}
                      className="gap-2"
                      size={'sm'}
                      onClick={(e) => {
                        selectedRows.forEach((row) => {
                          handleMarkAsArchived(row.flowDisplayName, row.id);
                          row.delete();
                        });
                        resetSelection();
                      }}
                    >
                      <Check className="size-3" />
                      {t('Mark as Archived')}{' '}
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
                  failedStepName: row.stepName,
                })
            : undefined
        }
      />
    </div>
  );
}
