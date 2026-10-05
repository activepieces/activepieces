import { Permission } from '@activepieces/core-utils';
import {
  AppConnectionWithoutSensitiveData,
  formErrors,
  UpdateProjectPlatformRequest,
  PlatformRole,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { GlobalConnectionWarning } from '@/components/custom/global-connection-utils';
import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { globalConnectionsQueries } from '@/features/connections/hooks/global-connections-hooks';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

export function EditProjectDialog({
  open,
  onClose,
  onSaved,
  projectId,
  initialValues,
}: EditProjectDialogProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const globalConnectionsEnabled = platform.plan.globalConnectionsEnabled;

  const {
    data: globalConnectionsPage,
    isLoading: isLoadingConnections,
    isError: connectionsFailed,
    refetch: refetchConnections,
  } = globalConnectionsQueries.useGlobalConnections({
    request: { limit: 9999 },
    extraKeys: [],
  });

  const connections: GlobalConnectionsState = !globalConnectionsEnabled
    ? { status: 'disabled' }
    : connectionsFailed && globalConnectionsPage === undefined
    ? { status: 'failed', retry: () => refetchConnections() }
    : { status: 'ready', list: globalConnectionsPage?.data ?? [] };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t('Edit project')}</DialogTitle>
        </DialogHeader>

        {globalConnectionsEnabled && isLoadingConnections ? (
          <SkeletonList numberOfItems={3} className="h-10" />
        ) : (
          <EditProjectForm
            key={`${open ? projectId : 'closed'}-${connections.status}`}
            onClose={onClose}
            onSaved={onSaved}
            projectId={projectId}
            initialValues={initialValues}
            connections={connections}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

const EditProjectForm = ({
  onClose,
  onSaved,
  projectId,
  initialValues,
  connections,
}: {
  onClose: () => void;
  onSaved?: () => void;
  projectId: string;
  initialValues?: EditProjectDialogProps['initialValues'];
  connections: GlobalConnectionsState;
}) => {
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const queryClient = useQueryClient();
  const globalConnections =
    connections.status === 'ready' ? connections.list : [];

  const form = useForm<UpdateProjectPlatformRequest>({
    defaultValues: {
      displayName: initialValues?.projectName,
      externalId: initialValues?.externalId,
      sensitive: initialValues?.sensitive ?? false,
      globalConnectionExternalIds: currentConnectionIds({
        connections: globalConnections,
        projectId,
      }),
    },
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
    mode: 'onChange',
  });

  const { mutate, isPending } = projectCollectionUtils.useUpdateProject(
    () => {
      queryClient.invalidateQueries({
        queryKey: globalConnectionsQueries.getGlobalConnectionsQueryKey([]),
      });
      toast.success(t('Changes saved'));
      onSaved?.();
      onClose();
    },
    (error) => {
      mutationFeedback.markShown(error);
      form.setError('root.serverError', {
        type: 'manual',
        message: mutationFeedback.message(error),
      });
    },
  );

  const submit = (values: UpdateProjectPlatformRequest) => {
    if (isPending) {
      return;
    }
    form.clearErrors('root.serverError');
    mutate({
      projectId,
      request: editProjectRequest({
        values,
        connectionsStatus: connections.status,
        connectionsDirty:
          form.formState.dirtyFields.globalConnectionExternalIds !== undefined,
      }),
    });
  };

  const serverError = form.formState.errors.root?.serverError?.message;

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(submit)}
      >
        {connections.status !== 'disabled' && <GlobalConnectionWarning />}
        <FormField
          name="displayName"
          rules={{
            validate: (value: string | undefined) =>
              (value ?? '').trim().length > 0 || formErrors.required,
          }}
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="displayName">{t('Name')}</Label>
              <Input
                {...field}
                id="displayName"
                placeholder={t('Customer success')}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {platform.plan.embeddingEnabled &&
          platformRole === PlatformRole.ADMIN && (
            <FormField
              name="externalId"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="externalId">{t('External ID')}</Label>
                  <FormDescription>
                    {t('Used to identify the project based on your SaaS ID')}
                  </FormDescription>
                  <Input
                    {...field}
                    id="externalId"
                    placeholder={t('org-3412321')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

        {platform.plan.environmentsEnabled &&
          platformRole === PlatformRole.ADMIN && (
            <FormField
              name="sensitive"
              render={({ field }) => (
                <FormItem className="flex-row items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="sensitive">{t('Sensitive project')}</Label>
                    <FormDescription>
                      {t(
                        'When enabled, publishing flows in this project requires approval.',
                      )}
                    </FormDescription>
                  </div>
                  <Switch
                    id="sensitive"
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    {...adminControl(AdminControl.PROJECTS_SENSITIVE_TOGGLE)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

        {connections.status === 'failed' && (
          <div className="flex flex-col gap-2">
            <Label>{t('Global connections')}</Label>
            <DataFetchErrorState
              entity={t('global connections')}
              onRetry={connections.retry}
              className="rounded-xl border py-6"
            />
            <p className="text-xs text-gray-11">
              {t(
                "Saving now keeps this project's global connections as they are.",
              )}
            </p>
          </div>
        )}

        {connections.status === 'ready' && (
          <FormField
            name="globalConnectionExternalIds"
            render={({ field }) => (
              <FormItem>
                <Label>{t('Global connections')}</Label>
                <MultiSelectPieceProperty
                  placeholder={t('Select global connections')}
                  options={globalConnections.map((connection) => ({
                    value: connection.externalId,
                    label: connection.displayName,
                  }))}
                  loading={false}
                  onChange={(value) => {
                    field.onChange(value ?? []);
                  }}
                  initialValues={field.value ?? []}
                  showDeselect={(field.value ?? []).length > 0}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {serverError && (
          <p role="alert" className="text-sm text-danger-11">
            {serverError}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isDirty}
            loading={isPending}
            {...adminControl(AdminControl.PROJECTS_EDIT_SUBMIT)}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export function editProjectRequest({
  values,
  connectionsStatus,
  connectionsDirty,
}: {
  values: UpdateProjectPlatformRequest;
  connectionsStatus: GlobalConnectionsState['status'];
  connectionsDirty: boolean;
}): UpdateProjectPlatformRequest {
  const sendConnections = connectionsStatus === 'ready' && connectionsDirty;
  return {
    displayName: values.displayName?.trim(),
    externalId: values.externalId,
    sensitive: values.sensitive,
    globalConnectionExternalIds: sendConnections
      ? values.globalConnectionExternalIds
      : undefined,
  };
}

function currentConnectionIds({
  connections,
  projectId,
}: {
  connections: AppConnectionWithoutSensitiveData[];
  projectId: string;
}): string[] {
  return connections
    .filter((connection) => connection.projectIds.includes(projectId))
    .map((connection) => connection.externalId);
}

type GlobalConnectionsState =
  | { status: 'disabled' }
  | { status: 'failed'; retry: () => void }
  | { status: 'ready'; list: AppConnectionWithoutSensitiveData[] };

export type EditProjectDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  projectId: string;
  initialValues?: {
    projectName?: string;
    externalId?: string;
    sensitive?: boolean;
  };
};
