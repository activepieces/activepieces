import {
  ApplicationEvent,
  ApplicationEventName,
  summarizeApplicationEvent,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  CheckIcon,
  Eye,
  Folder,
  History,
  Key,
  Link2,
  Logs,
  Users,
  Wand,
  Workflow,
  FileText,
  User,
  Clock,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { DataTable, DataTableFilters } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { auditLogQueries } from '@/features/platform-admin';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

export default function AuditLogsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [selectedEvent, setSelectedEvent] = useState<ApplicationEvent | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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

  const { data: auditLogsData, isLoading } = auditLogQueries.useAuditLogs();

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
              accessorKey: 'action',
              size: 180,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Action')}
                  icon={Wand}
                />
              ),
              cell: ({ row }) => {
                const icon = convertToIcon(row.original);
                return (
                  <div className="text-left flex items-center gap-2">
                    {!isNil(icon?.icon) && (
                      <span className="text-muted-foreground shrink-0">
                        {icon.icon}
                      </span>
                    )}
                    {formatUtils.convertEnumToHumanReadable(
                      row.original.action,
                    )}
                  </div>
                );
              },
            },
            {
              accessorKey: 'details',
              size: 320,
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
              size: 200,
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
              accessorKey: 'projectId',
              size: 130,
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
              size: 110,
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
            {
              id: 'view',
              size: 50,
              cell: ({ row }) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    setSelectedEvent(row.original);
                    setIsSheetOpen(true);
                  }}
                >
                  <Eye className="size-4 text-muted-foreground" />
                </Button>
              ),
            },
          ]}
          page={auditLogsData}
          isLoading={isLoading}
        />
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-[480px] sm:max-w-[480px] flex flex-col p-0">
            <SheetHeader className="px-6 py-4 border-b shrink-0">
              <SheetTitle className="text-base">
                {formatUtils.convertEnumToHumanReadable(
                  selectedEvent?.action ?? '',
                )}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedEvent && convertToDetails(selectedEvent)}
              </p>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 flex flex-col gap-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('Who & When')}
                </p>
                <div className="grid grid-cols-[150px_1fr] gap-y-3 text-sm">
                  {selectedEvent?.userEmail && (
                    <>
                      <span className="text-muted-foreground">
                        {t('Performed By')}
                      </span>
                      <span className="font-medium">
                        {selectedEvent.userEmail}
                      </span>
                    </>
                  )}
                  {selectedEvent?.projectDisplayName && (
                    <>
                      <span className="text-muted-foreground">
                        {t('Project')}
                      </span>
                      <span className="font-medium">
                        {selectedEvent.projectDisplayName}
                      </span>
                    </>
                  )}
                  {selectedEvent?.ip && (
                    <>
                      <span className="text-muted-foreground">
                        {t('IP Address')}
                      </span>
                      <span className="font-medium">{selectedEvent.ip}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">{t('Created')}</span>
                  <span className="font-medium">
                    {selectedEvent && (
                      <FormattedDate date={new Date(selectedEvent.created)} />
                    )}
                  </span>
                </div>
              </div>
              {selectedEvent &&
                extractEventDetails(selectedEvent).length > 0 && (
                  <>
                    <Separator />
                    <div className="px-6 py-5 flex flex-col gap-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t('Event Details')}
                      </p>
                      <div className="grid grid-cols-[150px_1fr] gap-y-3 text-sm">
                        {extractEventDetails(selectedEvent).map(
                          ({ label, value }) => (
                            <Fragment key={label}>
                              <span className="text-muted-foreground">
                                {label}
                              </span>
                              <span className="font-medium">{value}</span>
                            </Fragment>
                          ),
                        )}
                      </div>
                    </div>
                  </>
                )}
              <Separator />
              <div className="px-6 py-5 flex flex-col gap-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('Full Payload')}
                </p>
                <SimpleJsonViewer data={selectedEvent?.data ?? {}} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </LockedFeatureGuard>
  );
}

function convertToIcon(event: ApplicationEvent) {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_FINISHED:
    case ApplicationEventName.FLOW_RUN_STARTED:
    case ApplicationEventName.FLOW_RUN_RESUMED:
    case ApplicationEventName.FLOW_RUN_RETRIED:
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

function convertToDetails(event: ApplicationEvent): string {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_STARTED:
      return `Flow run started in ${formatUtils.convertEnumToHumanReadable(
        event.data.flowRun.environment,
      )} environment`;
    case ApplicationEventName.FLOW_RUN_FINISHED:
      return `Flow run finished — ${formatUtils.convertEnumToHumanReadable(
        event.data.flowRun.status,
      )}`;
    case ApplicationEventName.FLOW_RUN_RESUMED:
      return `Flow run resumed in ${formatUtils.convertEnumToHumanReadable(
        event.data.flowRun.environment,
      )} environment`;
    case ApplicationEventName.FLOW_RUN_RETRIED:
      return `Flow run retried from failed step in ${formatUtils.convertEnumToHumanReadable(
        event.data.flowRun.environment,
      )} environment`;
    case ApplicationEventName.FLOW_CREATED:
      return t('A new flow was created');
    case ApplicationEventName.FLOW_DELETED:
      return `Flow "${event.data.flowVersion.displayName}" was deleted`;
    default:
      return summarizeApplicationEvent(event) ?? '';
  }
}

function extractEventDetails(event: ApplicationEvent): EventDetailRow[] {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_STARTED:
    case ApplicationEventName.FLOW_RUN_FINISHED:
    case ApplicationEventName.FLOW_RUN_RESUMED:
    case ApplicationEventName.FLOW_RUN_RETRIED: {
      const { flowRun } = event.data;
      const rows: EventDetailRow[] = [
        {
          label: t('Status'),
          value: formatUtils.convertEnumToHumanReadable(flowRun.status),
        },
        {
          label: t('Environment'),
          value: formatUtils.convertEnumToHumanReadable(flowRun.environment),
        },
      ];
      if (flowRun.triggeredBy) {
        rows.push({
          label: t('Triggered By'),
          value: formatUtils.convertEnumToHumanReadable(flowRun.triggeredBy),
        });
      }
      if (flowRun.startTime) {
        rows.push({
          label: t('Start Time'),
          value: new Date(flowRun.startTime).toLocaleString(),
        });
      }
      if (flowRun.finishTime) {
        rows.push({
          label: t('Finish Time'),
          value: new Date(flowRun.finishTime).toLocaleString(),
        });
      }
      return rows;
    }
    case ApplicationEventName.FLOW_CREATED:
      return [];
    case ApplicationEventName.FLOW_DELETED:
    case ApplicationEventName.FLOW_UPDATED:
      return [{ label: t('Flow'), value: event.data.flowVersion.displayName }];
    case ApplicationEventName.CONNECTION_UPSERTED:
    case ApplicationEventName.CONNECTION_DELETED: {
      const { connection } = event.data;
      return [
        { label: t('Connection'), value: connection.displayName },
        { label: t('Piece'), value: connection.pieceName },
        {
          label: t('Type'),
          value: formatUtils.convertEnumToHumanReadable(connection.type),
        },
        {
          label: t('Status'),
          value: formatUtils.convertEnumToHumanReadable(connection.status),
        },
      ];
    }
    case ApplicationEventName.FOLDER_CREATED:
    case ApplicationEventName.FOLDER_UPDATED:
    case ApplicationEventName.FOLDER_DELETED:
      return [{ label: t('Folder'), value: event.data.folder.displayName }];
    case ApplicationEventName.USER_SIGNED_IN:
    case ApplicationEventName.USER_PASSWORD_RESET:
    case ApplicationEventName.USER_EMAIL_VERIFIED:
      return [];
    case ApplicationEventName.USER_SIGNED_UP:
      return [
        {
          label: t('Source'),
          value: formatUtils.convertEnumToHumanReadable(event.data.source),
        },
      ];
    case ApplicationEventName.SIGNING_KEY_CREATED:
      return [
        { label: t('Key Name'), value: event.data.signingKey.displayName },
      ];
    case ApplicationEventName.PROJECT_ROLE_CREATED:
    case ApplicationEventName.PROJECT_ROLE_UPDATED:
    case ApplicationEventName.PROJECT_ROLE_DELETED: {
      const { projectRole } = event.data;
      return [
        { label: t('Role'), value: projectRole.name },
        {
          label: t('Permissions'),
          value: projectRole.permissions
            .map((p) => formatUtils.convertEnumToHumanReadable(p))
            .join(', '),
        },
      ];
    }
    case ApplicationEventName.PROJECT_RELEASE_CREATED: {
      const { release } = event.data;
      const rows: EventDetailRow[] = [
        { label: t('Release'), value: release.name },
        {
          label: t('Type'),
          value: formatUtils.convertEnumToHumanReadable(release.type),
        },
      ];
      if (release.description) {
        rows.push({ label: t('Description'), value: release.description });
      }
      return rows;
    }
  }
}

type EventDetailRow = {
  label: string;
  value: string;
};
