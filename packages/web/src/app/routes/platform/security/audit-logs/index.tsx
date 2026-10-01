import {
  AgentActionKind,
  AgentActionOutcome,
  AgentRunSource,
  ApplicationEvent,
  ApplicationEventName,
  summarizeApplicationEvent,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Bot,
  CircleArrowUp,
  Folder,
  History,
  Key,
  Link2,
  Logs,
  Shield,
  Undo2,
  Users,
  Variable,
  Workflow,
} from 'lucide-react';
import { Fragment, useState } from 'react';

import { DataTable } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableFilter } from '@/components/custom/data-table/data-table-filter';
import { Page, PageHeader, Toolbar } from '@/components/custom/page';
import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { EmptyMedia } from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { auditLogQueries } from '@/features/platform-admin';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';

import {
  InitialsTile,
  listFormat,
  MutedCell,
  NameCell,
} from '../../components/list-cell';
import { sampleData } from '../../sample-data';

export default function AuditLogsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [selectedEvent, setSelectedEvent] = useState<ApplicationEvent | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { data: projects } = projectCollectionUtils.useAll();
  const { data: users } = platformUserHooks.useUsers();
  const userNames = new Map(
    (users?.data ?? []).map((user) => [
      user.id,
      `${user.firstName} ${user.lastName}`.trim() || user.email,
    ]),
  );

  const {
    data: auditLogsData,
    isLoading,
    isError,
    refetch,
  } = auditLogQueries.useAuditLogs();
  const isSample = !platform.plan.auditLogEnabled;
  const rows = isSample ? sampleData.auditEventsPage() : auditLogsData;
  const selectedDetails = selectedEvent
    ? extractEventDetails(selectedEvent)
    : [];

  return (
    <Page>
      <PageHeader
        title={t('Audit log')}
        description={t(
          'Every meaningful action on the platform: who did it, when, from where, and what it touched.',
        )}
      />
      <Toolbar>
        <DataTableFilter
          type="select"
          title={t('Event')}
          accessorKey="action"
          options={Object.values(ApplicationEventName).map((action) => ({
            label: actionLabel(action),
            value: action,
          }))}
        />
        <DataTableFilter
          type="select"
          title={t('Person')}
          accessorKey="userId"
          options={
            users?.data?.map((user) => ({
              label: userNames.get(user.id) ?? user.email,
              value: user.id,
            })) ?? []
          }
        />
        <DataTableFilter
          type="select"
          title={t('Project')}
          accessorKey="projectId"
          options={
            projects?.map((project) => ({
              label: project.displayName,
              value: project.id,
            })) ?? []
          }
        />
        <DataTableFilter type="date" title={t('Date')} accessorKey="created" />
      </Toolbar>
      <DataTable
        emptyStateTextTitle={t('No events yet')}
        emptyStateTextDescription={t(
          'Events appear here as people sign in, build flows and change settings.',
        )}
        emptyStateIcon={
          <EmptyMedia variant="icon">
            <History />
          </EmptyMedia>
        }
        onRowClick={(event) => {
          setSelectedEvent(event);
          setIsSheetOpen(true);
        }}
        columns={[
          {
            accessorKey: 'created',
            size: 190,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('When')} />
            ),
            cell: ({ row }) => (
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-gray-12">
                  {listFormat.relativeDate(row.original.created)}
                </span>
                <span className="truncate text-xs text-gray-11">
                  {listFormat.dateTime(row.original.created)}
                </span>
              </div>
            ),
          },
          {
            accessorKey: 'action',
            size: 440,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Event')} />
            ),
            cell: ({ row }) => (
              <NameCell
                media={
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gray-3 text-gray-11 [&_svg]:size-3.5">
                    {convertToIcon(row.original)?.icon ?? <History />}
                  </span>
                }
                title={
                  convertToDetails(row.original) ||
                  actionLabel(row.original.action)
                }
                sub={actionLabel(row.original.action)}
              />
            ),
          },
          {
            accessorKey: 'userId',
            size: 220,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Actor')} />
            ),
            cell: ({ row }) => {
              const name = row.original.userId
                ? userNames.get(row.original.userId) ?? row.original.userEmail
                : row.original.userEmail;
              if (!name) {
                return (
                  <div className="flex min-w-0 items-center gap-2.5">
                    <InitialsTile name={t('System')} />
                    <MutedCell>{t('System')}</MutedCell>
                  </div>
                );
              }
              return (
                <div className="flex min-w-0 items-center gap-2.5">
                  <InitialsTile name={name} />
                  <span className="truncate text-gray-12">{name}</span>
                </div>
              );
            },
          },
          {
            accessorKey: 'projectId',
            size: 170,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Project')} />
            ),
            cell: ({ row }) => (
              <MutedCell>
                {row.original.projectDisplayName ??
                  ('project' in row.original.data
                    ? row.original.data.project?.displayName
                    : undefined) ??
                  t('Platform')}
              </MutedCell>
            ),
          },
          {
            accessorKey: 'ip',
            size: 150,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('IP')} />
            ),
            cell: ({ row }) => (
              <MutedCell className="font-mono text-xs">
                {row.original.ip ?? '—'}
              </MutedCell>
            ),
          },
        ]}
        page={rows}
        isLoading={isSample ? false : isLoading}
        isError={isSample ? false : isError}
        errorStateEntity={t('audit logs')}
        onRetry={refetch}
      />
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent size="sm">
          <SheetHeader>
            <SheetTitle>{actionLabel(selectedEvent?.action ?? '')}</SheetTitle>
            <SheetDescription>
              {selectedEvent && convertToDetails(selectedEvent)}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-3 p-5">
              <p className="text-sm font-medium text-gray-12">
                {t('Who and when')}
              </p>
              <dl className="grid grid-cols-[9rem_1fr] gap-y-3 text-sm">
                {selectedEvent?.userEmail && (
                  <>
                    <dt className="text-gray-11">{t('Actor')}</dt>
                    <dd className="text-gray-12">{selectedEvent.userEmail}</dd>
                  </>
                )}
                {selectedEvent?.projectDisplayName && (
                  <>
                    <dt className="text-gray-11">{t('Project')}</dt>
                    <dd className="text-gray-12">
                      {selectedEvent.projectDisplayName}
                    </dd>
                  </>
                )}
                {selectedEvent?.ip && (
                  <>
                    <dt className="text-gray-11">{t('IP address')}</dt>
                    <dd className="font-mono text-gray-12">
                      {selectedEvent.ip}
                    </dd>
                  </>
                )}
                <dt className="text-gray-11">{t('When')}</dt>
                <dd className="text-gray-12">
                  {selectedEvent && listFormat.dateTime(selectedEvent.created)}
                </dd>
              </dl>
            </div>
            {selectedDetails.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-3 p-5">
                  <p className="text-sm font-medium text-gray-12">
                    {t('Details')}
                  </p>
                  <dl className="grid grid-cols-[9rem_1fr] gap-y-3 text-sm">
                    {selectedDetails.map(({ label, value }) => (
                      <Fragment key={label}>
                        <dt className="text-gray-11">{label}</dt>
                        <dd className="text-gray-12">{value}</dd>
                      </Fragment>
                    ))}
                  </dl>
                </div>
              </>
            )}
            <Separator />
            <div className="flex flex-col gap-3 p-5">
              <p className="text-sm font-medium text-gray-12">
                {t('Full payload')}
              </p>
              <SimpleJsonViewer data={selectedEvent?.data ?? {}} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Page>
  );
}

function actionLabel(action: string): string {
  const words = action.split(/[._]/).join(' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function convertToIcon(event: ApplicationEvent) {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_FINISHED:
    case ApplicationEventName.FLOW_RUN_STARTED:
    case ApplicationEventName.FLOW_RUN_RESUMED:
    case ApplicationEventName.FLOW_RUN_RETRIED:
      return {
        icon: <Logs className="size-4" />,
        tooltip: t('Flow run'),
      };
    case ApplicationEventName.FLOW_CREATED:
    case ApplicationEventName.FLOW_DELETED:
    case ApplicationEventName.FLOW_UPDATED:
    case ApplicationEventName.FLOW_PUBLISHED:
    case ApplicationEventName.FLOW_ACTIVATED:
    case ApplicationEventName.FLOW_DEACTIVATED:
      return {
        icon: <Workflow className="size-4" />,
        tooltip: t('Flow'),
      };
    case ApplicationEventName.FLOW_PIECES_UPGRADED:
      return {
        icon: <CircleArrowUp className="size-4" />,
        tooltip: t('Flow pieces upgraded'),
      };
    case ApplicationEventName.FLOW_PIECES_REVERTED:
      return {
        icon: <Undo2 className="size-4" />,
        tooltip: t('Flow pieces reverted'),
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
    case ApplicationEventName.VARIABLE_UPSERTED:
    case ApplicationEventName.VARIABLE_DELETED:
    case ApplicationEventName.VARIABLE_VALUE_REVEALED:
      return {
        icon: <Variable className="size-4" />,
        tooltip: t('Variable'),
      };
    case ApplicationEventName.AGENT_CREATED:
    case ApplicationEventName.AGENT_UPDATED:
    case ApplicationEventName.AGENT_DELETED:
    case ApplicationEventName.AGENT_PUBLISHED:
    case ApplicationEventName.AGENT_UNPUBLISHED:
    case ApplicationEventName.AGENT_ACTION_EXECUTED:
      return {
        icon: <Bot className="size-4" />,
        tooltip: t('Agent action'),
      };
    case ApplicationEventName.USER_SIGNED_UP:
    case ApplicationEventName.USER_SIGNED_IN:
    case ApplicationEventName.USER_PASSWORD_RESET:
    case ApplicationEventName.USER_EMAIL_VERIFIED:
      return {
        icon: <Users className="size-4" />,
        tooltip: t('User'),
      };
    case ApplicationEventName.PROJECT_ROLE_CREATED:
    case ApplicationEventName.PROJECT_ROLE_UPDATED:
    case ApplicationEventName.PROJECT_ROLE_DELETED:
      return {
        icon: <Shield className="size-4" />,
        tooltip: t('Role'),
      };
    case ApplicationEventName.SIGNING_KEY_CREATED:
      return {
        icon: <Key className="size-4" />,
        tooltip: t('Signing key'),
      };
    default:
      return undefined;
  }
}

function convertToDetails(event: ApplicationEvent): string {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_STARTED:
      return `Flow run started in ${actionLabel(
        event.data.flowRun.environment,
      )} environment`;
    case ApplicationEventName.FLOW_RUN_FINISHED:
      return `Flow run finished — ${actionLabel(
        event.data.flowRun.status,
      )}`;
    case ApplicationEventName.FLOW_RUN_RESUMED:
      return `Flow run resumed in ${actionLabel(
        event.data.flowRun.environment,
      )} environment`;
    case ApplicationEventName.FLOW_RUN_RETRIED:
      return `Flow run retried from failed step in ${actionLabel(
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
          value: actionLabel(flowRun.status),
        },
        {
          label: t('Environment'),
          value: actionLabel(flowRun.environment),
        },
      ];
      if (flowRun.triggeredBy) {
        rows.push({
          label: t('Triggered by'),
          value: actionLabel(flowRun.triggeredBy),
        });
      }
      if (flowRun.startTime) {
        rows.push({
          label: t('Started'),
          value: new Date(flowRun.startTime).toLocaleString(),
        });
      }
      if (flowRun.finishTime) {
        rows.push({
          label: t('Finished'),
          value: new Date(flowRun.finishTime).toLocaleString(),
        });
      }
      return rows;
    }
    case ApplicationEventName.FLOW_CREATED:
      return [];
    case ApplicationEventName.FLOW_DELETED:
    case ApplicationEventName.FLOW_UPDATED:
    case ApplicationEventName.FLOW_PUBLISHED:
    case ApplicationEventName.FLOW_ACTIVATED:
    case ApplicationEventName.FLOW_DEACTIVATED:
      return [{ label: t('Flow'), value: event.data.flowVersion.displayName }];
    case ApplicationEventName.FLOW_PIECES_UPGRADED: {
      const { flowId, steps } = event.data;
      return [
        { label: t('Flow'), value: flowId },
        ...steps.map((step) => ({
          label: step.stepName,
          value: `${step.actionOrTriggerName}: ${
            step.decision === 'UPGRADED'
              ? `${step.prevVersion} → ${step.newVersion}`
              : t('kept at {version}', { version: step.prevVersion })
          }`,
        })),
      ];
    }
    case ApplicationEventName.FLOW_PIECES_REVERTED: {
      const { flowId, steps } = event.data;
      return [
        { label: t('Flow'), value: flowId },
        ...steps.map((step) => ({
          label: step.stepName,
          value: `${step.actionOrTriggerName}: ${step.prevVersion} → ${step.newVersion}`,
        })),
      ];
    }
    case ApplicationEventName.CONNECTION_UPSERTED:
    case ApplicationEventName.CONNECTION_DELETED: {
      const { connection } = event.data;
      return [
        { label: t('Connection'), value: connection.displayName },
        { label: t('Piece'), value: connection.pieceName ?? '—' },
        {
          label: t('Type'),
          value: actionLabel(connection.type),
        },
        {
          label: t('Status'),
          value: actionLabel(connection.status),
        },
      ];
    }
    case ApplicationEventName.VARIABLE_UPSERTED:
    case ApplicationEventName.VARIABLE_DELETED:
    case ApplicationEventName.VARIABLE_VALUE_REVEALED: {
      const { variable } = event.data;
      return [{ label: t('Variable'), value: variable.name }];
    }
    case ApplicationEventName.AGENT_CREATED:
    case ApplicationEventName.AGENT_UPDATED:
    case ApplicationEventName.AGENT_DELETED:
    case ApplicationEventName.AGENT_PUBLISHED:
    case ApplicationEventName.AGENT_UNPUBLISHED: {
      const { agent } = event.data;
      return [
        { label: t('Agent'), value: agent.displayName },
        ...(agent.publishedDigest
          ? [{ label: t('Published version'), value: agent.publishedDigest }]
          : []),
        ...(agent.publishedToolNames?.length
          ? [{ label: t('Tools'), value: agent.publishedToolNames.join(', ') }]
          : []),
      ];
    }
    case ApplicationEventName.AGENT_ACTION_EXECUTED: {
      const { agent, action, connection, source, flow, outcome } = event.data;
      return [
        ...(agent
          ? [{ label: t('Agent'), value: agent.displayName ?? agent.id }]
          : []),
        ...(action.kind === AgentActionKind.FLOW
          ? [{ label: t('Flow'), value: action.displayName }]
          : [
              { label: t('Action'), value: action.displayName },
              { label: t('App'), value: action.pieceDisplayName },
            ]),
        ...(outcome === undefined
          ? []
          : [{ label: t('Result'), value: OUTCOME_LABEL[outcome]() }]),
        { label: t('Ran from'), value: RAN_FROM_LABEL[source]() },
        ...(flow ? [{ label: t('Flow run'), value: flow.runId }] : []),
        ...(connection
          ? [
              {
                label: t('Account'),
                value: connection.label ?? connection.externalId,
              },
            ]
          : []),
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
          value: actionLabel(event.data.source),
        },
      ];
    case ApplicationEventName.SIGNING_KEY_CREATED:
      return [
        { label: t('Key name'), value: event.data.signingKey.displayName },
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
            .map((p) => actionLabel(p))
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
          value: actionLabel(release.type),
        },
      ];
      if (release.description) {
        rows.push({ label: t('Description'), value: release.description });
      }
      return rows;
    }
    case ApplicationEventName.PROJECT_REPLACED: {
      const { applied, failedCount, outcome, durationMs } = event.data;
      return [
        {
          label: t('Outcome'),
          value: actionLabel(outcome),
        },
        { label: t('Duration'), value: `${durationMs}ms` },
        {
          label: t('Flows'),
          value: `${applied.flowsCreated} created, ${applied.flowsUpdated} updated, ${applied.flowsDeleted} deleted`,
        },
        {
          label: t('Tables'),
          value: `${applied.tablesCreated} created, ${applied.tablesUpdated} updated, ${applied.tablesDeleted} deleted`,
        },
        {
          label: t('Folders'),
          value: `${applied.foldersCreated} created, ${applied.foldersUpdated} updated, ${applied.foldersDeleted} deleted`,
        },
        { label: t('Failed'), value: String(failedCount) },
      ];
    }
    case ApplicationEventName.FLOW_APPROVAL_REQUESTED:
    case ApplicationEventName.FLOW_APPROVAL_GRANTED:
    case ApplicationEventName.FLOW_APPROVAL_WITHDRAWN: {
      const rows: EventDetailRow[] = [
        {
          label: t('Flow'),
          value: event.data.flowDisplayName ?? event.data.flowId,
        },
      ];
      return rows;
    }
    case ApplicationEventName.FLOW_APPROVAL_REJECTED: {
      const rows: EventDetailRow[] = [
        {
          label: t('Flow'),
          value: event.data.flowDisplayName ?? event.data.flowId,
        },
      ];
      if (event.data.rejectionReason) {
        rows.push({ label: t('Reason'), value: event.data.rejectionReason });
      }
      return rows;
    }
  }
}

type EventDetailRow = {
  label: string;
  value: string;
};

const OUTCOME_LABEL: Record<AgentActionOutcome, () => string> = {
  [AgentActionOutcome.SUCCEEDED]: () => t('Succeeded'),
  [AgentActionOutcome.FAILED]: () => t('Failed'),
};

const RAN_FROM_LABEL: Record<AgentRunSource, () => string> = {
  [AgentRunSource.FLOW_STEP]: () => t('A flow step'),
  [AgentRunSource.AGENT]: () => t('The agent page'),
  [AgentRunSource.CHAT]: () => t('Chat'),
  [AgentRunSource.AGENT_BUILDER]: () => t('The agent builder'),
};
