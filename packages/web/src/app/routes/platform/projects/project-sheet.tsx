import { isNil } from '@activepieces/core-utils';
import {
  AlertChannel,
  ApFlagId,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Fact, FactList } from '@/components/custom/fact-list';
import { listFormat } from '@/components/custom/list/list-format';
import { Panel } from '@/components/custom/panel';
import { ChipListField } from '@/components/custom/settings-parts';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import { alertsApi } from '@/features/alerts/api/alerts-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { ActiveFlowsCell, ProjectRow, ProjectTile } from './columns';

export function ProjectSheet({
  project,
  onOpenChange,
  onOpenProject,
  onEdit,
  onDelete,
  onChanged,
}: {
  project: ProjectRow | null;
  onOpenChange: (open: boolean) => void;
  onOpenProject: (project: ProjectRow) => void;
  onEdit: (project: ProjectRow) => void;
  onDelete: (project: ProjectRow) => void;
  onChanged: () => void;
}) {
  return (
    <Sheet open={project !== null} onOpenChange={onOpenChange}>
      <SheetContent size="sm">
        {project && (
          <ProjectSheetContent
            project={project}
            onOpenProject={onOpenProject}
            onEdit={onEdit}
            onDelete={onDelete}
            onChanged={onChanged}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ProjectSheetContent({
  project,
  onOpenProject,
  onEdit,
  onDelete,
  onChanged,
}: {
  project: ProjectRow;
  onOpenProject: (project: ProjectRow) => void;
  onEdit: (project: ProjectRow) => void;
  onDelete: (project: ProjectRow) => void;
  onChanged: () => void;
}) {
  const { data: showAlerts } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_ALERTS,
  );
  const { platform } = platformHooks.useCurrentPlatform();
  const globalConnectionsEnabled = platform.plan.globalConnectionsEnabled;
  const isPersonal = project.type === ProjectType.PERSONAL;
  const typeLabel = isPersonal ? t('Personal project') : t('Team project');
  return (
    <>
      <SheetHeader className="flex-row items-center gap-3">
        <ProjectTile project={project} className="size-9 rounded-lg text-sm" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <SheetTitle className="truncate">{project.displayName}</SheetTitle>
          <SheetDescription className="truncate">
            {[typeLabel, project.ownerName].filter(Boolean).join(' · ')}
          </SheetDescription>
        </div>
      </SheetHeader>
      <SheetBody>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenProject(project)}
          >
            <ArrowUpRight />
            {t('Open project')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
            <Pencil />
            {t('Edit')}
          </Button>
        </div>
        <FactList>
          <Fact label={t('Owner')}>{project.ownerName ?? '—'}</Fact>
          <Fact label={t('Members')}>
            {t('{active} active of {total} members', {
              active: project.analytics.activeUsers,
              total: project.analytics.totalUsers,
            })}
          </Fact>
          {globalConnectionsEnabled && (
            <Fact label={t('Global connections')}>
              {listFormat.count(project.globalConnectionsCount ?? 0)}
            </Fact>
          )}
          <Fact label={t('Flows')}>
            {listFormat.count(project.analytics.totalFlows)}
          </Fact>
          <Fact label={t('Active flows')}>
            <ActiveFlowsCell project={project} />
          </Fact>
          <Fact label={t('Last activity')}>
            {listFormat.relativeDate(project.analytics.lastFlowUpdated)}
          </Fact>
          <Fact label={t('Created')}>
            {listFormat.dateTime(project.created)}
          </Fact>
          <Fact label={t('External ID')}>
            <span className="font-mono">{project.externalId ?? '—'}</span>
          </Fact>
        </FactList>
        <Panel
          title={t('Limits')}
          description={t('How many flows can be on at once.')}
        >
          <ActiveFlowsLimitForm
            key={`${project.id}-${project.plan.activeFlowsLimit}`}
            project={project}
            onChanged={onChanged}
          />
        </Panel>
        {showAlerts && <ProjectAlertsPanel projectId={project.id} />}
      </SheetBody>
      <SheetFooter>
        <Button
          variant="outline"
          className="w-full text-danger-11 hover:text-danger-11"
          onClick={() => onDelete(project)}
        >
          <Trash2 />
          {t('Delete project')}
        </Button>
      </SheetFooter>
    </>
  );
}

function ActiveFlowsLimitForm({
  project,
  onChanged,
}: {
  project: ProjectWithLimits;
  onChanged: () => void;
}) {
  const form = useForm<LimitFormValues>({
    resolver: zodResolver(LimitFormSchema),
    defaultValues: limitDefaults({ project }),
    mode: 'onChange',
  });
  const { mutate, isPending } = useMutation({
    mutationFn: (values: LimitFormValues) => {
      const raw = values.activeFlowsLimit.trim();
      return api.post<ProjectWithLimits>(`/v1/projects/${project.id}`, {
        plan: {
          activeFlowsLimit: raw.length === 0 ? null : Number(raw),
        },
      });
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'));
      onChanged();
    },
    onError: () => internalErrorToast(),
  });
  return (
    <Form {...form}>
      <form
        className="flex items-start gap-2"
        onSubmit={form.handleSubmit((values) => mutate(values))}
      >
        <FormField
          control={form.control}
          name="activeFlowsLimit"
          render={({ field }) => (
            <FormItem className="flex-1">
              <Input
                {...field}
                inputMode="numeric"
                aria-label={t('Active flows limit')}
                placeholder={t('No limit')}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!form.formState.isDirty || isPending}
          loading={isPending}
        >
          {t('Save')}
        </Button>
      </form>
    </Form>
  );
}

function ProjectAlertsPanel({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ['platform-project-alerts', projectId];
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () =>
      (await alertsApi.list({ projectId, limit: ALERTS_LIMIT })).data,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const { mutate: add, isPending: adding } = useMutation({
    mutationFn: (email: string) =>
      alertsApi.create({
        projectId,
        channel: AlertChannel.EMAIL,
        receiver: email,
      }),
    onSuccess: refresh,
    onError: () => internalErrorToast(),
  });
  const { mutate: remove, isPending: removing } = useMutation({
    mutationFn: (alertId: string) => alertsApi.delete(alertId),
    onSuccess: refresh,
    onError: () => internalErrorToast(),
  });
  const alerts = data ?? [];
  return (
    <Panel
      title={t('Alert emails')}
      description={t('Who gets an email when a flow in this project fails.')}
    >
      {isError ? (
        <DataFetchErrorState
          entity={t('alert emails')}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <ChipListField
          values={alerts.map((alert) => alert.receiver)}
          onAdd={(email) => add(email)}
          onRemove={(email) => {
            const match = alerts.find((alert) => alert.receiver === email);
            if (!isNil(match)) {
              remove(match.id);
            }
          }}
          placeholder={t('name@company.com')}
          emptyLabel={t('No one gets alerts yet.')}
          validate={(value) =>
            z.email().safeParse(value).success
              ? null
              : t('Enter a valid email address')
          }
          disabled={adding || removing}
        />
      )}
    </Panel>
  );
}

function limitDefaults({
  project,
}: {
  project: ProjectWithLimits;
}): LimitFormValues {
  return {
    activeFlowsLimit: isNil(project.plan.activeFlowsLimit)
      ? ''
      : String(project.plan.activeFlowsLimit),
  };
}

const ALERTS_LIMIT = 100;

const LimitFormSchema = z.object({
  activeFlowsLimit: z
    .string()
    .refine((value) => value.trim() === '' || /^[1-9]\d*$/.test(value.trim()), {
      message: 'Enter a whole number above zero, or leave empty',
    }),
});

type LimitFormValues = z.infer<typeof LimitFormSchema>;
