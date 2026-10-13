import { formErrors, Permission, tryCatch } from '@activepieces/core-utils';
import {
  AppConnectionWithoutSensitiveData,
  UpdateProjectPlatformRequest,
  PlatformRole,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { GlobalConnectionWarning } from '@/components/custom/global-connection-utils';
import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogDescription,
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
import { Switch } from '@/components/ui/switch';
import { globalConnectionsQueries } from '@/features/connections/hooks/global-connections-hooks';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  initialValues?: {
    projectName?: string;
    externalId?: string;
    sensitive?: boolean;
  };
  pieceSetField?: PieceSetField;
}

export function EditProjectDialog({
  open,
  onClose,
  projectId,
  initialValues,
  pieceSetField,
}: EditProjectDialogProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const globalConnectionsEnabled = platform.plan.globalConnectionsEnabled;

  const { data: globalConnectionsPage, isLoading: isLoadingConnections } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: [],
    });

  const globalConnections = globalConnectionsPage?.data ?? [];
  const isSaving =
    useIsMutating({ mutationKey: projectCollectionUtils.updateMutationKey }) >
    0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isSaving) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="break-words">
            {t('Edit {name}', { name: initialValues?.projectName ?? '' })}
          </DialogTitle>
          <DialogDescription>
            {t("Change this project's name and settings.")}
          </DialogDescription>
        </DialogHeader>

        {(!globalConnectionsEnabled || !isLoadingConnections) &&
        pieceSetField?.status !== 'loading' ? (
          <EditProjectForm
            key={pieceSetField?.status ?? 'none'}
            onClose={onClose}
            projectId={projectId}
            initialValues={initialValues}
            globalConnections={globalConnections}
            globalConnectionsEnabled={globalConnectionsEnabled}
            pieceSetField={pieceSetField}
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
  pieceSetField,
}: {
  onClose: () => void;
  projectId: string;
  initialValues?: EditProjectDialogProps['initialValues'];
  globalConnections: AppConnectionWithoutSensitiveData[];
  globalConnectionsEnabled: boolean;
  pieceSetField?: PieceSetField;
}) => {
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const queryClient = useQueryClient();
  const currentConnectionExternalIds = globalConnections
    .filter((connection) => connection.projectIds.includes(projectId))
    .map((connection) => connection.externalId);

  const { mutateAsync: updateProject } =
    projectCollectionUtils.useUpdateProject(
      () => {
        queryClient.invalidateQueries({
          queryKey: globalConnectionsQueries.getGlobalConnectionsQueryKey([]),
        });
      },
      () => undefined,
    );
  const readyField = pieceSetField?.status === 'ready' ? pieceSetField : null;
  const save = useMutation({
    mutationKey: projectCollectionUtils.updateMutationKey,
    mutationFn: async (values: EditProjectFormValues) => {
      await updateProject({
        projectId,
        request: {
          displayName: values.displayName?.trim(),
          externalId: values.externalId,
          sensitive: values.sensitive,
          globalConnectionExternalIds: values.globalConnectionExternalIds,
        },
      });
      const nextSetId = values.pieceSetId;
      if (
        readyField === null ||
        nextSetId === undefined ||
        nextSetId === readyField.initialValue
      ) {
        return;
      }
      const { error } = await tryCatch(() => readyField.save(nextSetId));
      if (error) {
        throw new PartialSaveError(readyField.saveFailedMessage(error));
      }
    },
    onSuccess: () => {
      mutationFeedback.success(t('Changes saved'));
      onClose();
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message:
          error instanceof PartialSaveError
            ? error.message
            : mutationFeedback.message(error),
      });
    },
  });

  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(EditProjectFormSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: initialValues?.projectName ?? '',
      externalId: initialValues?.externalId,
      sensitive: initialValues?.sensitive ?? false,
      globalConnectionExternalIds: currentConnectionExternalIds,
      pieceSetId: readyField?.initialValue,
    },
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          form.clearErrors('root.serverError');
          return save.mutateAsync(values).catch(() => undefined);
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

        {pieceSetField?.status === 'error' && pieceSetField.render()}
        {readyField && (
          <FormField
            name="pieceSetId"
            render={({ field }) => (
              <FormItem>
                {readyField.render({
                  value: field.value,
                  onChange: field.onChange,
                  disabled: field.disabled,
                })}
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

        {form.formState.errors.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}

        <DialogFooter className="justify-end mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={form.formState.isSubmitting}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
            loading={form.formState.isSubmitting}
            {...adminControl(AdminControl.PROJECTS_EDIT_SUBMIT)}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const EditProjectFormSchema = UpdateProjectPlatformRequest.extend({
  displayName: z.string().trim().min(1, formErrors.required),
  pieceSetId: z.string().optional(),
});

type EditProjectFormValues = z.infer<typeof EditProjectFormSchema>;

class PartialSaveError extends Error {}

export type PieceSetField =
  | { status: 'loading' }
  | { status: 'error'; render: () => ReactNode }
  | {
      status: 'ready';
      initialValue: string | undefined;
      render: (field: {
        value: string | undefined;
        onChange: (value: string) => void;
        disabled?: boolean;
      }) => ReactNode;
      save: (pieceSetId: string) => Promise<void>;
      saveFailedMessage: (error: unknown) => string;
    };
