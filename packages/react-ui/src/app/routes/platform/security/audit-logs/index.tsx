import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  CheckIcon,
  Folder,
  History,
  Key,
  Link2,
  Logs,
  Users,
  Wand,
  Workflow,
  Database,
  FileText,
  User,
  Clock,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import {
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { FormattedDate } from '@/components/ui/formatted-date';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { auditEventsApi } from '@/features/platform-admin/lib/audit-events-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { platformUserHooks } from '@/hooks/platform-user-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { formatUtils } from '@/lib/utils';
import {
  ApplicationEvent,
  ApplicationEventName,
  summarizeApplicationEvent,
} from '@activepieces/ee-shared';
import { isNil } from '@activepieces/shared';

export default function AuditLogsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [searchParams] = useSearchParams();
  const { data: projects } = projectCollectionUtils.useAll();
  const { data: users } = platformUserHooks.useUsers();

  const filters: DataTableFilters<keyof ApplicationEvent>[] = [
    {
      type: 'select',
      title: t('Action'),
      accessorKey: 'action',
      options: Object.values(ApplicationEventName).map((action) => {
        return {
          label: formatUtils.convertEnumToHumanReadable(action),
          value: action,
        };
      }),
      icon: Wand,
    },
    {
      type: 'select',
      title: t('Performed By'),
      accessorKey: 'userId',
      options:
        users?.data?.map((user) => {
          return {
            label: user.email,
            value: user.id,
          };
        }) ?? [],
      icon: Users,
    },
    {
      type: 'select',
      title: t('Project'),
      accessorKey: 'projectId',
      options:
        projects?.map((project) => {
          return {
            label: project.displayName,
            value: project.id,
          };
        }) ?? [],
      icon: Folder,
    },
    {
      type: 'date',
      title: t('Created'),
      accessorKey: 'created',
      icon: CheckIcon,
    },
  ];

  const { data: auditLogsData, isLoading } = useQuery({
    queryKey: ['audit-logs', searchParams.toString()],
    staleTime: 0,
    gcTime: 0,
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

  const isEnabled = platform.plan.auditLogEnabled;
  return (
    <LockedFeatureGuard
      featureKey="AUDIT_LOGS"
      locked={!isEnabled}
      lockTitle={t('Unlock Audit Logs')}
      lockDescription={t(
        'Comply with internal and external security policies by tracking activities done within your account',
      )}
    >
      <div className="flex flex-col  w-full">
        <DashboardPageHeader
          description={t('Track activities done within your platform')}
          title={t('Audit Logs')}
        />
        <DataTable
          emptyStateTextTitle={t('No audit logs found')}
          emptyStateTextDescription={t(
            'Come back later when you have some activity to audit',
          )}
          emptyStateIcon={<History className="size-14" />}
          filters={filters}
          columns={[
            {
              accessorKey: 'resource',
              size: 120,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Resource')}
                  icon={Database}
                />
              ),
              cell: ({ row }) => {
                const icon = convertToIcon(row.original);
                if (isNil(icon?.icon)) {
                  return <div className="text-left"></div>;
                }
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-left flex items-center gap-2">
                        {icon.icon} {icon.tooltip}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {icon.tooltip}
                    </TooltipContent>
                  </Tooltip>
                );
              },
            },
            {
              accessorKey: 'details',
              size: 200,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Details')}
                  icon={FileText}
                />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">
                    {convertToDetails(row.original)}
                  </div>
                );
              },
            },
            {
              accessorKey: 'userId',
              size: 180,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Performed By')}
                  icon={User}
                />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">{row.original.userEmail}</div>
                );
              },
            },
            {
              accessorKey: 'action',
              size: 150,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Action')}
                  icon={Wand}
                />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">
                    {formatUtils.convertEnumToHumanReadable(
                      row.original.action,
                    )}
                  </div>
                );
              },
            },
            {
              accessorKey: 'projectId',
              size: 150,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Project')}
                  icon={Folder}
                />
              ),
              cell: ({ row }) => {
                return row.original.projectId &&
                  'project' in row.original.data ? (
                  <Link to={`/projects/${row.original.projectId}`}>
                    <div className="text-left text-primary hover:underline">
                      {row.original.data.project?.displayName}
                    </div>
                  </Link>
                ) : (
                  <div className="text-left">{t('N/A')}</div>
                );
              },
            },
            {
              accessorKey: 'created',
              size: 150,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Created')}
                  icon={Clock}
                />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">
                    <FormattedDate date={new Date(row.original.created)} />
                  </div>
                );
              },
            },
          ]}
          page={auditLogsData}
          isLoading={isLoading}
        />
      </div>
    </LockedFeatureGuard>
  );
}

function convertToIcon(event: ApplicationEvent) {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_FINISHED:
    case ApplicationEventName.FLOW_RUN_STARTED:
      return {
        icon: <Logs className="size-4" />,
        tooltip: t('Flow Run'),
      };
    case ApplicationEventName.FLOW_CREATED:
    case ApplicationEventName.FLOW_DELETED:
    case ApplicationEventName.FLOW_UPDATED:
      return {
        icon: <Workflow className="size-4" />,
        tooltip: t('Flow'),
      };
    case ApplicationEventName.FOLDER_CREATED:
    case ApplicationEventName.FOLDER_DELETED:
    case ApplicationEventName.FOLDER_UPDATED:
      return {
        icon: <Folder className="size-4" />,
        tooltip: t('Folder'),
      };
    case ApplicationEventName.CONNECTION_DELETED:
    case ApplicationEventName.CONNECTION_UPSERTED:
      return {
        icon: <Link2 className="size-4" />,
        tooltip: t('Connection'),
      };
    case ApplicationEventName.USER_SIGNED_UP:
    case ApplicationEventName.USER_SIGNED_IN:
    case ApplicationEventName.USER_PASSWORD_RESET:
    case ApplicationEventName.USER_EMAIL_VERIFIED:
      return {
        icon: <Users className="size-4" />,
        tooltip: t('User'),
      };
    case ApplicationEventName.SIGNING_KEY_CREATED:
      return {
        icon: <Key className="size-4" />,
        tooltip: t('Signing Key'),
      };
    default:
      return undefined;
  }
}

const convertToDetails = summarizeApplicationEvent;
