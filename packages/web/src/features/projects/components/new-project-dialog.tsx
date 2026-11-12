import { ErrorCode } from '@activepieces/core-utils';
import {
  AppConnectionWithoutSensitiveData,
  CreatePlatformProjectRequest,
  PlatformRole,
  ProjectWithLimits,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { DefaultTag } from '@/components/custom/global-connection-utils';
import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { SkeletonList } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { globalConnectionsQueries } from '@/features/connections';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';

type NewProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (project: ProjectWithLimits) => void;
  limitReached?: boolean;
  onLimitReached: () => void;
};

export const NewProjectDialog = (props: NewProjectDialogProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const globalConnectionsEnabled = platform.plan.globalConnectionsEnabled;

  const { data: globalConnectionsPage, isLoading: isLoadingConnections } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: [],
    });

  const globalConnections = globalConnectionsPage?.data ?? [];

  return (
    <Dialog
      key={props.open ? 'open' : 'closed'}
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create Project')}</DialogTitle>
          <DialogDescription>
            {t(
              'Set up a new project to organize your automations and connections.',
            )}
          </DialogDescription>
        </DialogHeader>
        {(!isLoadingConnections || !globalConnectionsEnabled) && (
          <NewProjectForm
            setOpen={props.onOpenChange}
            globalConnections={globalConnections}
            globalConnectionsEnabled={globalConnectionsEnabled}
            onCreate={props.onCreate}
            limitReached={props.limitReached}
            onLimitReached={props.onLimitReached}
          />
        )}
        {isLoadingConnections && globalConnectionsEnabled && (
          <SkeletonList numberOfItems={3} className="h-10" />
        )}
      </DialogContent>
    </Dialog>
  );
};

const NewProjectForm = ({
  onCreate,
  limitReached,
  onLimitReached,
  setOpen,
  globalConnections,
  globalConnectionsEnabled,
}: Omit<NewProjectDialogProps, 'open' | 'onOpenChange'> & {
  setOpen: (open: boolean) => void;
  globalConnections: AppConnectionWithoutSensitiveData[];
  globalConnectionsEnabled: boolean;
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

  const showLimit = () => {
    setOpen(false);
    onLimitReached();
  };

  const submit = (event: React.BaseSyntheticEvent) => {
    if (limitReached) {
      event.preventDefault();
      showLimit();
      return;
    }
    form
      .handleSubmit(handleCreate)(event)
      .catch(() => undefined);
  };

  const handleCreate = () => {
    const values = form.getValues();
    const alertReceiverEmail = values.alertReceiverEmail?.trim();
    mutate({
      ...values,
      alertReceiverEmail:
        alertReceiverEmail && alertReceiverEmail.length > 0
          ? alertReceiverEmail
          : null,
    });
  };

  const { mutate, isPending } = projectCollectionUtils.useCreateProject(
    (data) => {
      onCreate?.(data);
      setOpen(false);
      queryClient.invalidateQueries({
        queryKey: globalConnectionsQueries.getGlobalConnectionsQueryKey([]),
      });
    },
    (error) => {
      if (api.isApError(error, ErrorCode.QUOTA_EXCEEDED)) {
        queryClient
          .invalidateQueries({ queryKey: ['platform'] })
          .catch(() => undefined);
        showLimit();
        return;
      }
      console.error(error);
      internalErrorToast();
    },
  );

  return (
    <>
      <Form {...form}>
        <form className="grid space-y-4" onSubmit={submit}>
          <FormField
            name="displayName"
            render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="displayName" showRequiredIndicator>
                  {t('Project Name')}
                </Label>
                <Input
                  {...field}
                  id="displayName"
                  placeholder={t('Project Name')}
                />
              </FormItem>
            )}
          />
          <FormField
            name="alertReceiverEmail"
            render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="alertReceiverEmail">
                  {t('Alert Receiver Email')}
                </Label>
                <Input
                  {...field}
                  id="alertReceiverEmail"
                  type="email"
                  placeholder="alerts@example.com"
                  value={field.value ?? ''}
                />
                <span className="text-xs text-gray-11">
                  {t('Receives flow failure emails for this project.')}
                </span>
                <FormMessage />
              </FormItem>
            )}
          />
          {canToggleSensitive && (
            <FormField
              name="sensitive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="sensitive">{t('Sensitive Project')}</Label>
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
          {globalConnectionsEnabled && (
            <FormField
              name="globalConnectionExternalIds"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label>{t('Global Connections')}</Label>
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
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
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
              disabled={isPending}
              loading={isPending}
              {...adminControl(AdminControl.PROJECTS_NEW_SUBMIT)}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                submit(e);
              }}
            >
              {t('Create Project')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};
