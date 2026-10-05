import {
  AppConnectionWithoutSensitiveData,
  CreatePlatformProjectRequest,
  PlatformRole,
  ProjectWithLimits,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Crown } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { DefaultTag } from '@/components/custom/global-connection-utils';
import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { globalConnectionsQueries } from '@/features/connections';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

type NewProjectDialogProps = {
  children: React.ReactNode;
  onCreate?: (project: ProjectWithLimits) => void;
  onBlocked?: () => void;
  gate?: {
    locked: boolean;
    content: (args: { onClose: () => void }) => React.ReactNode;
  };
};

export const NewProjectDialog = (props: NewProjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const [blockedOnSubmit, setBlockedOnSubmit] = useState(false);
  const showGate = props.gate?.locked === true || blockedOnSubmit;
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

  const globalConnections = globalConnectionsPage?.data ?? [];

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next && props.gate?.locked === true) {
      props.onBlocked?.();
    }
    if (!next) {
      setBlockedOnSubmit(false);
    }
  };

  return (
    <Dialog
      key={open ? 'open' : 'closed'}
      open={open}
      onOpenChange={changeOpen}
    >
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        {showGate && props.gate !== undefined ? (
          props.gate.content({ onClose: () => changeOpen(false) })
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('New project')}</DialogTitle>
              <DialogDescription>
                {t(
                  'A shared workspace for one team. Its flows, connections and tables are visible only to its members and platform admins.',
                )}
              </DialogDescription>
            </DialogHeader>
            {(!isLoadingConnections || !globalConnectionsEnabled) && (
              <NewProjectForm
                key={connectionsFailed ? 'connections-failed' : 'ready'}
                setOpen={setOpen}
                globalConnections={globalConnections}
                globalConnectionsEnabled={globalConnectionsEnabled}
                connectionsFailed={
                  connectionsFailed && globalConnectionsPage === undefined
                }
                onRetryConnections={() => refetchConnections()}
                onCreate={props.onCreate}
                gate={
                  props.gate === undefined
                    ? undefined
                    : {
                        locked: props.gate.locked,
                        onBlocked: () => {
                          setBlockedOnSubmit(true);
                          props.onBlocked?.();
                        },
                      }
                }
              />
            )}
            {isLoadingConnections && globalConnectionsEnabled && (
              <SkeletonList numberOfItems={3} className="h-10" />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const NewProjectForm = ({
  onCreate,
  setOpen,
  globalConnections,
  globalConnectionsEnabled,
  connectionsFailed,
  onRetryConnections,
  gate,
}: Omit<NewProjectDialogProps, 'children' | 'gate'> & {
  setOpen: (open: boolean) => void;
  globalConnections: AppConnectionWithoutSensitiveData[];
  globalConnectionsEnabled: boolean;
  connectionsFailed: boolean;
  onRetryConnections: () => void;
  gate?: { locked: boolean; onBlocked: () => void };
}) => {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const canToggleSensitive =
    platform.plan.environmentsEnabled && platformRole === PlatformRole.ADMIN;
  const preselectedConnectionExternalIds = globalConnections
    .filter((connection) => connection.preSelectForNewProjects)
    .map((connection) => connection.externalId);

  const form = useForm<CreatePlatformProjectRequest>({
    resolver: zodResolver(
      z.object({
        displayName: z.string().min(1, t('Name is required')),
        alertReceiverEmail: z
          .email(t('Invalid email'))
          .nullable()
          .optional()
          .or(z.literal('')),
      }),
    ),
    defaultValues: {
      globalConnectionExternalIds: preselectedConnectionExternalIds,
      alertReceiverEmail: '',
      sensitive: false,
    },
  });

  const handleCreate = (values: CreatePlatformProjectRequest) => {
    if (isPending) {
      return;
    }
    if (gate?.locked === true) {
      gate.onBlocked();
      return;
    }
    form.clearErrors('root.serverError');
    const alertReceiverEmail = values.alertReceiverEmail?.trim();
    mutate({
      ...values,
      displayName: values.displayName.trim(),
      globalConnectionExternalIds: connectionsFailed
        ? undefined
        : values.globalConnectionExternalIds,
      alertReceiverEmail:
        alertReceiverEmail && alertReceiverEmail.length > 0
          ? alertReceiverEmail
          : null,
    });
  };

  const { mutate, isPending } = projectCollectionUtils.useCreateProject(
    (data) => {
      toast.success(t('{name} created', { name: data.displayName }));
      onCreate?.(data);
      setOpen(false);
      queryClient.invalidateQueries({
        queryKey: globalConnectionsQueries.getGlobalConnectionsQueryKey([]),
      });
    },
    (error) => {
      mutationFeedback.markShown(error);
      form.setError('root.serverError', {
        type: 'manual',
        message: mutationFeedback.message(error),
      });
    },
  );

  return (
    <>
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(handleCreate)}
        >
          <FormField
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="displayName">{t('Name')}</Label>
                <Input
                  {...field}
                  id="displayName"
                  autoFocus
                  placeholder={t('Customer success')}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="alertReceiverEmail"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="alertReceiverEmail">
                  {t('Alert email (optional)')}
                </Label>
                <Input
                  {...field}
                  id="alertReceiverEmail"
                  type="email"
                  placeholder="alerts@example.com"
                  value={field.value ?? ''}
                />
                <FormDescription>
                  {t(
                    'Gets an email the first time a flow fails each day. Members can add themselves later.',
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {canToggleSensitive && (
            <FormField
              name="sensitive"
              render={({ field }) => (
                <FormItem className="flex-row items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="sensitive">{t('Sensitive project')}</Label>
                    <FormDescription>
                      {t(
                        'Publishing a flow needs approval from someone with the permission.',
                      )}
                    </FormDescription>
                  </div>
                  <Switch
                    id="sensitive"
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    {...adminControl(AdminControl.PROJECTS_SENSITIVE_TOGGLE)}
                  />
                </FormItem>
              )}
            />
          )}
          {globalConnectionsEnabled && connectionsFailed && (
            <div className="flex flex-col gap-2">
              <Label>{t('Global connections')}</Label>
              <DataFetchErrorState
                entity={t('global connections')}
                onRetry={onRetryConnections}
                className="rounded-xl border py-6"
              />
              <p className="text-xs text-gray-11">
                {t('You can add global connections later from Edit.')}
              </p>
            </div>
          )}
          {globalConnectionsEnabled && !connectionsFailed && (
            <FormField
              name="globalConnectionExternalIds"
              render={({ field }) => (
                <FormItem>
                  <Label>{t('Global connections')}</Label>
                  <MultiSelectPieceProperty
                    placeholder={t('Select global connections')}
                    options={
                      globalConnections.map((connection) => ({
                        value: connection.externalId,
                        label: connection.displayName,
                      })) ?? []
                    }
                    loading={false}
                    onChange={(value) => {
                      field.onChange(value ?? []);
                    }}
                    itemExtraContent={(index) => {
                      if (globalConnections[index].preSelectForNewProjects) {
                        return <DefaultTag />;
                      }
                      return null;
                    }}
                    initialValues={field.value ?? []}
                    showDeselect={(field.value ?? []).length > 0}
                  />
                </FormItem>
              )}
            />
          )}
          {form?.formState?.errors?.root?.serverError && (
            <p role="alert" className="text-sm text-danger-11">
              {form.formState.errors.root.serverError.message}
            </p>
          )}
          <DialogFooter>
            <Button
              variant={'outline'}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setOpen(false);
              }}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              loading={isPending}
              {...adminControl(AdminControl.PROJECTS_NEW_SUBMIT)}
            >
              {gate?.locked === true && <Crown className="size-3.5 shrink-0" />}
              {t('Create')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};
