import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, CheckCircle, CheckIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEffectOnce } from 'react-use';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  LIMIT_QUERY_PARAM,
  CURSOR_QUERY_PARAM,
} from '@/components/ui/data-table';
import { toast } from '@/components/ui/use-toast';
import { issuesApi } from '@/features/issues/api/issues-api';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { IssueStatus, Permission } from '@activepieces/shared';

import { issuesTableColumns } from './columns';

export function IssuesTable() {
  const { refetch } = issueHooks.useIssuesNotification();

  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = authenticationSession.getProjectId()!;
  const currentSearchParams = searchParams.toString();

  const statusValues = searchParams.getAll('status');
  const hasStatusFilter = statusValues.length > 0;

  useEffectOnce(() => {
    if (!hasStatusFilter) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.append('status', IssueStatus.UNRESOLVED);
      setSearchParams(newSearchParams);
    }
  });

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
    enabled: true,
    queryFn: () => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;
      return issuesApi.list({
        projectId,
        cursor: cursor ?? undefined,
        limit,
        status:
          statusValues.length > 0
            ? statusValues.map((value) => value as IssueStatus)
            : undefined,
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
  const userHasPermissionToMarkAsArchived = checkAccess(
    Permission.WRITE_ISSUES,
  );

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
                      disabled={
                        !userHasPermissionToMarkAsArchived ||
                        selectedRows.length === 0
                      }
                      className="gap-2"
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
      />
    </div>
  );
}
