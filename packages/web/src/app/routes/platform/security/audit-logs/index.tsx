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
import * as React from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { DataTable } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableFilter } from '@/components/custom/data-table/data-table-filter';
import { Fact, FactList } from '@/components/custom/fact-list';
import {
  DateCell,
  MutedCell,
  NameCell,
  PersonCell,
} from '@/components/custom/list/list-cells';
import { listFormat } from '@/components/custom/list/list-format';
import { ListToolbar } from '@/components/custom/list/list-toolbar';
import { Page } from '@/components/custom/page';
import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { auditLogQueries } from '@/features/platform-admin';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import {
  EventLabelsMap,
  useEventLabels,
} from '../../infra/event-destinations/lib/use-event-labels';
import { sampleData } from '../../sample-data';

export default function AuditLogsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [searchParams] = useSearchParams();
  const [selectedEvent, setSelectedEvent] = useState<ApplicationEvent | null>(
    null,
  );
  const eventLabels = useEventLabels();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
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
  const filtered = FILTER_PARAMS.some(
    (param) => searchParams.getAll(param).length > 0,
  );
  const actorName = (event: ApplicationEvent) =>
    (event.userId ? userNames.get(event.userId) : undefined) ?? event.userEmail;

  return (
    <Page>
      <AdminPageHeader page="auditLog" />
      <ListToolbar
        filters={
          <>
            <DataTableFilter
              type="select"
              title={t('Event')}
              accessorKey="action"
              options={Object.values(ApplicationEventName).map((action) => ({
                label: eventLabel({ action, eventLabels }),
                value: action,
              }))}
            />
            <DataTableFilter
              type="select"
              single
              title={t('Person')}
              accessorKey="userId"
              options={(users?.data ?? []).map((user) => ({
                label: userNames.get(user.id) ?? user.email,
                value: user.id,
              }))}
            />
            <DataTableFilter
              type="select"
              title={t('Project')}
              accessorKey="projectId"
              options={(projects ?? []).map((project) => ({
                label: getProjectName(project),
                value: project.id,
              }))}
            />
            <DataTableFilter
              type="date"
              title={t('Date')}
              accessorKey="created"
            />
          </>
        }
      />
      <DataTable
        emptyStateTextTitle={
          filtered ? t('No events match') : t('No events yet')
        }
        emptyStateTextDescription={
          filtered
            ? t('Try a wider date range or clear a filter.')
            : t(
                'Events appear here as people sign in, build flows and change settings.',
              )
        }
        emptyStateIcon={<History />}
        onRowClick={(event) => setSelectedEvent(event)}
        columns={[
          {
            accessorKey: 'created',
            size: 148,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('When')} />
            ),
            cell: ({ row }) => <DateCell value={row.original.created} />,
          },
          {
            accessorKey: 'action',
            size: 440,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Event')} />
            ),
            cell: ({ row }) => (
              <NameCell
                media={<EventIcon event={row.original} />}
                title={
                  eventSentence(row.original) ||
                  eventLabel({ action: row.original.action, eventLabels })
                }
                sub={eventLabel({ action: row.original.action, eventLabels })}
              />
            ),
          },
          {
            accessorKey: 'userId',
            size: 200,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Actor')} />
            ),
            cell: ({ row }) => (
              <PersonCell name={actorName(row.original) ?? t('System')} />
            ),
          },
          {
            accessorKey: 'projectId',
            size: 170,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Project')} />
            ),
            cell: ({ row }) => (
              <MutedCell>{projectLabel(row.original)}</MutedCell>
            ),
          },
          {
            accessorKey: 'ip',
            size: 140,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('IP')} />
            ),
            cell: ({ row }) => (
              <MutedCell className="font-mono text-xs">
                {row.original.ip}
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
      <Sheet
        open={selectedEvent !== null}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <SheetContent size="sm">
          {selectedEvent && (
            <EventSheetContent
              event={selectedEvent}
              eventLabels={eventLabels}
              actor={actorName(selectedEvent)}
            />
          )}
        </SheetContent>
      </Sheet>
    </Page>
  );
}

function EventSheetContent({
  event,
  eventLabels,
  actor,
}: {
  event: ApplicationEvent;
  eventLabels: EventLabelsMap;
  actor: string | undefined;
}) {
  const details = extractEventDetails(event);
  return (
    <>
      <SheetHeader className="flex-row items-center gap-3">
        <EventIcon event={event} className="size-9 rounded-lg [&_svg]:size-4" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <SheetTitle className="truncate">
            {eventLabel({ action: event.action, eventLabels })}
          </SheetTitle>
          <SheetDescription className="line-clamp-2">
            {eventSentence(event) || listFormat.dateTime(event.created)}
          </SheetDescription>
        </div>
      </SheetHeader>
      <SheetBody>
        <FactList>
          <Fact label={t('When')}>{listFormat.dateTime(event.created)}</Fact>
          <Fact label={t('Actor')}>{actor ?? t('System')}</Fact>
          {event.userEmail && event.userEmail !== actor && (
            <Fact label={t('Email')}>{event.userEmail}</Fact>
          )}
          <Fact label={t('Project')}>{projectLabel(event)}</Fact>
          <Fact label={t('IP address')}>
            <span className="font-mono">{event.ip ?? '—'}</span>
          </Fact>
        </FactList>
        {details.length > 0 && (
          <FactList>
            {details.map(({ label, value }) => (
              <Fact key={label} label={label}>
                {value}
              </Fact>
            ))}
          </FactList>
        )}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-12">
            {t('Full payload')}
          </p>
          <SimpleJsonViewer data={event.data} />
        </div>
      </SheetBody>
    </>
  );
}

function EventIcon({
  event,
  className,
}: {
  event: ApplicationEvent;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-md bg-gray-3 text-gray-11 [&_svg]:size-3.5',
        className,
      )}
    >
      {eventIcon(event) ?? <History />}
    </span>
  );
}

function projectLabel(event: ApplicationEvent): string {
  return (
    event.projectDisplayName ??
    ('project' in event.data ? event.data.project?.displayName : undefined) ??
    t('Platform')
  );
}

function eventLabel({
  action,
  eventLabels,
}: {
  action: ApplicationEventName;
  eventLabels: EventLabelsMap;
}): string {
  return eventLabels[action]?.label ?? humanize(action);
}

function humanize(action: string): string {
  const words = action.split(/[._]/).join(' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function eventIcon(event: ApplicationEvent): React.ReactNode {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_FINISHED:
    case ApplicationEventName.FLOW_RUN_STARTED:
    case ApplicationEventName.FLOW_RUN_RESUMED:
    case ApplicationEventName.FLOW_RUN_RETRIED:
      return <Logs />;
    case ApplicationEventName.FLOW_CREATED:
    case ApplicationEventName.FLOW_DELETED:
    case ApplicationEventName.FLOW_UPDATED:
    case ApplicationEventName.FLOW_PUBLISHED:
    case ApplicationEventName.FLOW_ACTIVATED:
    case ApplicationEventName.FLOW_DEACTIVATED:
      return <Workflow />;
    case ApplicationEventName.FLOW_PIECES_UPGRADED:
      return <CircleArrowUp />;
    case ApplicationEventName.FLOW_PIECES_REVERTED:
      return <Undo2 />;
    case ApplicationEventName.FOLDER_CREATED:
    case ApplicationEventName.FOLDER_DELETED:
    case ApplicationEventName.FOLDER_UPDATED:
      return <Folder />;
    case ApplicationEventName.CONNECTION_DELETED:
    case ApplicationEventName.CONNECTION_UPSERTED:
      return <Link2 />;
    case ApplicationEventName.VARIABLE_UPSERTED:
    case ApplicationEventName.VARIABLE_DELETED:
    case ApplicationEventName.VARIABLE_VALUE_REVEALED:
      return <Variable />;
    case ApplicationEventName.AGENT_CREATED:
    case ApplicationEventName.AGENT_UPDATED:
    case ApplicationEventName.AGENT_DELETED:
    case ApplicationEventName.AGENT_PUBLISHED:
    case ApplicationEventName.AGENT_UNPUBLISHED:
    case ApplicationEventName.AGENT_ACTION_EXECUTED:
      return <Bot />;
    case ApplicationEventName.USER_SIGNED_UP:
    case ApplicationEventName.USER_SIGNED_IN:
    case ApplicationEventName.USER_PASSWORD_RESET:
    case ApplicationEventName.USER_EMAIL_VERIFIED:
      return <Users />;
    case ApplicationEventName.PROJECT_ROLE_CREATED:
    case ApplicationEventName.PROJECT_ROLE_UPDATED:
    case ApplicationEventName.PROJECT_ROLE_DELETED:
      return <Shield />;
    case ApplicationEventName.SIGNING_KEY_CREATED:
      return <Key />;
    default:
      return undefined;
  }
}

function eventSentence(event: ApplicationEvent): string {
  switch (event.action) {
    case ApplicationEventName.FLOW_RUN_STARTED:
      return t('Flow run started in {environment}', {
        environment: humanize(event.data.flowRun.environment),
      });
    case ApplicationEventName.FLOW_RUN_FINISHED:
      return t('Flow run finished: {status}', {
        status: humanize(event.data.flowRun.status),
      });
    case ApplicationEventName.FLOW_RUN_RESUMED:
      return t('Flow run resumed in {environment}', {
        environment: humanize(event.data.flowRun.environment),
      });
    case ApplicationEventName.FLOW_RUN_RETRIED:
      return t('Flow run retried from the failed step in {environment}', {
        environment: humanize(event.data.flowRun.environment),
      });
    case ApplicationEventName.FLOW_CREATED:
      return t('A new flow was created');
    case ApplicationEventName.FLOW_DELETED:
      return t('Flow "{name}" was deleted', {
        name: event.data.flowVersion.displayName,
      });
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
          value: humanize(flowRun.status),
        },
        {
          label: t('Environment'),
          value: humanize(flowRun.environment),
        },
      ];
      if (flowRun.triggeredBy) {
        rows.push({
          label: t('Triggered by'),
          value: humanize(flowRun.triggeredBy),
        });
      }
      if (flowRun.startTime) {
        rows.push({
          label: t('Started'),
          value: listFormat.dateTime(flowRun.startTime),
        });
      }
      if (flowRun.finishTime) {
        rows.push({
          label: t('Finished'),
          value: listFormat.dateTime(flowRun.finishTime),
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
          value: humanize(connection.type),
        },
        {
          label: t('Status'),
          value: humanize(connection.status),
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
          value: humanize(event.data.source),
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
          value: projectRole.permissions.map((p) => humanize(p)).join(', '),
        },
      ];
    }
    case ApplicationEventName.PROJECT_RELEASE_CREATED: {
      const { release } = event.data;
      const rows: EventDetailRow[] = [
        { label: t('Release'), value: release.name },
        {
          label: t('Type'),
          value: humanize(release.type),
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
          value: humanize(outcome),
        },
        {
          label: t('Duration'),
          value: t('{ms} ms', { ms: durationMs }),
        },
        {
          label: t('Flows'),
          value: t('{created} created, {updated} updated, {deleted} deleted', {
            created: applied.flowsCreated,
            updated: applied.flowsUpdated,
            deleted: applied.flowsDeleted,
          }),
        },
        {
          label: t('Tables'),
          value: t('{created} created, {updated} updated, {deleted} deleted', {
            created: applied.tablesCreated,
            updated: applied.tablesUpdated,
            deleted: applied.tablesDeleted,
          }),
        },
        {
          label: t('Folders'),
          value: t('{created} created, {updated} updated, {deleted} deleted', {
            created: applied.foldersCreated,
            updated: applied.foldersUpdated,
            deleted: applied.foldersDeleted,
          }),
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

const FILTER_PARAMS = [
  'action',
  'userId',
  'projectId',
  'createdAfter',
  'createdBefore',
];

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
