import { isNil, SeekPage } from '@activepieces/core-utils';
import { ApFlagId, ProjectType, ProjectWithLimits } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowUpRight, Pencil, Trash2, XIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Fact, FactList } from '@/components/custom/fact-list';
import { useGuardedClose } from '@/components/custom/leave-without-saving';
import { listFormat } from '@/components/custom/list/list-format';
import { Panel } from '@/components/custom/panel';
import { ChipListField, SaveBar } from '@/components/custom/settings-parts';
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
import { alertMutations, alertQueries } from '@/features/alerts';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { ActiveFlowsValue, ProjectRow, ProjectTile } from './columns';
import { PLATFORM_PROJECTS_QUERY_KEY } from './use-platform-projects';

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
      {project && (
        <ProjectSheetContent
          key={project.id}
          project={project}
          onClose={() => onOpenChange(false)}
          onOpenProject={onOpenProject}
          onEdit={onEdit}
          onDelete={onDelete}
          onChanged={onChanged}
        />
      )}
    </Sheet>
  );
}

function ProjectSheetContent({
  project,
  onClose,
  onOpenProject,
  onEdit,
  onDelete,
  onChanged,
}: {
  project: ProjectRow;
  onClose: () => void;
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
  const limit = useActiveFlowsLimitForm({ project, onChanged });
  const { requestClose, dialog } = useGuardedClose({
    dirty: limit.dirty,
    onClose,
  });
  const guardDismiss = (event: Event) => {
    if (limit.dirty) {
      event.preventDefault();
      requestClose();
    }
  };

  return (
    <SheetContent
      size="sm"
      showCloseButton={false}
      onEscapeKeyDown={guardDismiss}
      onInteractOutside={guardDismiss}
    >
      <SheetHeader className="flex-row items-center gap-3">
        <ProjectTile project={project} className="size-9 rounded-lg text-sm" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <SheetTitle className="truncate">{project.displayName}</SheetTitle>
          <SheetDescription className="truncate">
            {[typeLabel, project.ownerName].filter(Boolean).join(' · ')}
          </SheetDescription>
        </div>
      </SheetHeader>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-6 right-6"
        aria-label={t('Close')}
        onClick={requestClose}
      >
        <XIcon />
      </Button>
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
          <Button
            variant="outline"
            size="sm"
            {...adminControl(AdminControl.PROJECTS_EDIT_OPEN)}
            onClick={() => onEdit(project)}
          >
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
            <ActiveFlowsValue project={project} />
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
          <Form {...limit.form}>
            <FormField
              control={limit.form.control}
              name="activeFlowsLimit"
              render={({ field }) => (
                <FormItem>
                  <Input
                    {...field}
                    inputMode="numeric"
                    aria-label={t('Active flows limit')}
                    placeholder={t('No limit')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        limit.submit();
                      }
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </Panel>
        {showAlerts && <ProjectAlertsPanel projectId={project.id} />}
      </SheetBody>
      <SheetFooter className="sm:items-center">
        {limit.dirty || limit.error ? (
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              limit.submit();
            }}
          >
            <SaveBar
              dirty={limit.dirty}
              saving={limit.saving}
              invalid={limit.invalid}
              error={limit.error}
              onDiscard={limit.discard}
            />
          </form>
        ) : (
          <Button
            variant="outline"
            className="w-full text-danger-11 hover:text-danger-11"
            {...adminControl(AdminControl.PROJECTS_DELETE_OPEN)}
            onClick={() => onDelete(project)}
          >
            <Trash2 />
            {t('Delete project')}
          </Button>
        )}
      </SheetFooter>
      {dialog}
    </SheetContent>
  );
}

function useActiveFlowsLimitForm({
  project,
  onChanged,
}: {
  project: ProjectWithLimits;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<LimitFormValues>({
    resolver: zodResolver(LimitFormSchema),
    defaultValues: limitDefaults({ project }),
    mode: 'onChange',
  });
  const { mutate, isPending } = useMutation({
    mutationFn: (values: LimitFormValues) =>
      api.post<ProjectWithLimits>(`/v1/projects/${project.id}`, {
        plan: { activeFlowsLimit: parseLimit(values.activeFlowsLimit) },
      }),
    onSuccess: (saved, values) => {
      queryClient.setQueriesData<SeekPage<ProjectWithLimits>>(
        { queryKey: PLATFORM_PROJECTS_QUERY_KEY },
        (page) =>
          page && {
            ...page,
            data: page.data.map((row) =>
              row.id === saved.id ? { ...row, plan: saved.plan } : row,
            ),
          },
      );
      form.reset(values);
      toast.success(t('Changes saved'));
      onChanged();
    },
    onError: (error) =>
      form.setError('root.serverError', {
        type: 'manual',
        message: mutationFeedback.message(error),
      }),
  });
  const submit = () => {
    if (isPending || !form.formState.isDirty) {
      return;
    }
    form.clearErrors('root.serverError');
    void form.handleSubmit((values) => mutate(values))();
  };
  const fieldErrors = form.formState.errors.activeFlowsLimit;
  return {
    form,
    submit,
    dirty: form.formState.isDirty,
    saving: isPending,
    invalid: fieldErrors !== undefined,
    error: form.formState.errors.root?.serverError?.message,
    discard: () => form.reset(limitDefaults({ project })),
  };
}

function ProjectAlertsPanel({ projectId }: { projectId: string }) {
  const { data, isLoading, isError, refetch } =
    alertQueries.usePlatformProjectAlerts({ projectId });
  const { add, remove } = alertMutations.usePlatformProjectAlertEmails({
    projectId,
  });
  const alerts = data ?? [];
  return (
    <Panel
      title={t('Alert emails')}
      description={t('Who gets an email when a flow in this project fails.')}
    >
      {isError && data === undefined ? (
        <DataFetchErrorState
          entity={t('alert emails')}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <ChipListField
          values={alerts.map((alert) => alert.receiver)}
          onAdd={add}
          onRemove={(email) => {
            const match = alerts.find((alert) => alert.receiver === email);
            if (!isNil(match)) {
              remove(match);
            }
          }}
          placeholder={t('name@company.com')}
          emptyLabel={t('No one gets alerts yet.')}
          validate={(value) =>
            z.email().safeParse(value).success
              ? null
              : t('Enter a valid email address')
          }
        />
      )}
    </Panel>
  );
}

function parseLimit(raw: string): number | null {
  const value = raw.trim();
  return value.length === 0 ? null : Number(value);
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

const LimitFormSchema = z.object({
  activeFlowsLimit: z
    .string()
    .refine((value) => value.trim() === '' || /^[1-9]\d*$/.test(value.trim()), {
      message: 'Enter a whole number above zero, or leave empty',
    }),
});

type LimitFormValues = z.infer<typeof LimitFormSchema>;
