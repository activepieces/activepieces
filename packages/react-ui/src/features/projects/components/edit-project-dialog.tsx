import { UpdateProjectPlatformRequest } from '@activepieces/ee-shared';
import {
  AppConnectionWithoutSensitiveData,
  Permission,
  PlatformRole,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { GlobalConnectionWarning } from '@/components/custom/global-connection-utils';
import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
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
import { SkeletonList } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import { globalConnectionsQueries } from '@/features/connections/lib/global-connections-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { userHooks } from '@/hooks/user-hooks';

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  initialValues?: {
    projectName?: string;
    externalId?: string;
  };
}

export function EditProjectDialog({
  open,
  onClose,
  projectId,
  initialValues,
}: EditProjectDialogProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const globalConnectionsEnabled = platform.plan.globalConnectionsEnabled;

  const { data: globalConnectionsPage, isLoading: isLoadingConnections } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: [],
    });

  const globalConnections = globalConnectionsPage?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          {' '}
          <DialogTitle>
            {t('Edit')} {initialValues?.projectName}
          </DialogTitle>
        </DialogHeader>

        {!globalConnectionsEnabled || !isLoadingConnections ? (
          <EditProjectForm
            onClose={onClose}
            projectId={projectId}
            initialValues={initialValues}
            globalConnections={globalConnections}
            globalConnectionsEnabled={globalConnectionsEnabled}
          />
        ) : (
          <SkeletonList numberOfItems={3} className="h-10" />
        )}
      </DialogContent>
    </Dialog>
  );
}

const EditProjectForm = ({
  onClose,
  projectId,
  initialValues,
  globalConnections,
  globalConnectionsEnabled,
}: {
  onClose: () => void;
  projectId: string;
  initialValues?: EditProjectDialogProps['initialValues'];
  globalConnections: AppConnectionWithoutSensitiveData[];
  globalConnectionsEnabled: boolean;
}) => {
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const queryClient = useQueryClient();

  const currentConnectionExternalIds = globalConnections
    .filter((connection) => connection.projectIds.includes(projectId))
    .map((connection) => connection.externalId);

  const { mutate, isPending } = projectCollectionUtils.useUpdateProject(
    () => {
      queryClient.invalidateQueries({
        queryKey: globalConnectionsQueries.getGlobalConnectionsQueryKey([]),
      });
      toast.success(t('Your changes have been saved.'), {
        duration: 3000,
      });
      onClose();
    },
    (error) => {
      console.error(error);
      internalErrorToast();
    },
  );

  const form = useForm<UpdateProjectPlatformRequest>({
    defaultValues: {
      displayName: initialValues?.projectName,
      externalId: initialValues?.externalId,
      globalConnectionExternalIds: currentConnectionExternalIds,
    },
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          mutate({
            projectId,
            request: {
              displayName: values.displayName,
              externalId: values.externalId,
              globalConnectionExternalIds: values.globalConnectionExternalIds,
            },
          });
        })}
      >
        {globalConnectionsEnabled && <GlobalConnectionWarning />}
        <FormField
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="displayName">{t('Project Name')}</Label>
              <Input
                {...field}
                id="displayName"
                placeholder={t('Project Name')}
                className="rounded-sm"
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
                    className="rounded-sm"
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
              <FormItem>
                <Label>{t('Global Connections')}</Label>
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

        <DialogFooter className="justify-end mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" disabled={isPending} loading={isPending}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
