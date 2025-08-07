import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogFooter,
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
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';
import { projectApi } from '@/lib/project-api';
import {
  Permission,
  PlatformRole,
  ProjectWithLimits,
  ApErrorParams,
  ErrorCode,
} from '@activepieces/shared';

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  initialValues?: {
    projectName?: string;
    tasks?: string;
    aiCredits?: string;
    externalId?: string;
  };
}

type FormValues = {
  projectName: string;
  tasks: string;
  aiCredits: string;
  externalId?: string;
};

export function EditProjectDialog({
  open,
  onClose,
  projectId,
  initialValues,
}: EditProjectDialogProps) {
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const queryClient = useQueryClient();
  const { updateCurrentProject } = projectHooks.useCurrentProject();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    defaultValues: {
      projectName: initialValues?.projectName,
      tasks: initialValues?.tasks || '',
      aiCredits: initialValues?.aiCredits || '',
      externalId: initialValues?.externalId,
    },
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
  });

  useEffect(() => {
    if (open) {
      form.reset(initialValues);
    }
  }, [open]);

  const mutation = useMutation<
    ProjectWithLimits,
    Error,
    {
      displayName: string;
      externalId?: string;
      plan: { tasks: number | undefined; aiCredits?: number | undefined };
    }
  >({
    mutationFn: (request) => {
      updateCurrentProject(queryClient, request);
      return projectApi.update(projectId, {
        ...request,
        externalId:
          request.externalId?.trim() !== '' ? request.externalId : undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
      queryClient.invalidateQueries({
        queryKey: ['current-project'],
      });
      onClose();
    },
    onError: (error) => {
      if (api.isError(error)) {
        const apError = error.response?.data as ApErrorParams;
        switch (apError.code) {
          case ErrorCode.PROJECT_EXTERNAL_ID_ALREADY_EXISTS: {
            form.setError('root.serverError', {
              message: t('The external ID is already taken.'),
            });
            break;
          }
          default: {
            toast(INTERNAL_ERROR_TOAST);
            break;
          }
        }
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogTitle>{t('Edit Project')}</DialogTitle>
        <p className="text-sm text-muted-foreground mb-4 mt-1">
          {t('Update your project settings and configuration.')}
        </p>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutate({
                displayName: values.projectName,
                externalId: values.externalId,
                plan: {
                  tasks: values.tasks ? parseInt(values.tasks) : undefined,
                  aiCredits: values.aiCredits
                    ? parseInt(values.aiCredits)
                    : undefined,
                },
              }),
            )}
          >
            <FormField
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="projectName">{t('Project Name')}</Label>
                  <Input
                    {...field}
                    id="projectName"
                    placeholder={t('Project Name')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {platform.plan.manageProjectsEnabled && (
              <>
                <FormField
                  name="tasks"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="tasks">{t('Tasks')}</Label>
                      <div className="relative">
                        <Input
                          {...field}
                          type="number"
                          id="tasks"
                          placeholder={t('Tasks')}
                          className="rounded-sm pr-16"
                        />
                        {!field.disabled && (
                          <Button
                            variant="link"
                            type="button"
                            tabIndex={-1}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-xs px-2 py-1 h-7"
                            onClick={() => form.setValue('tasks', '')}
                          >
                            {t('Clear')}
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="aiCredits"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="aiCredits">{t('AI Credits')}</Label>
                      <div className="relative">
                        <Input
                          {...field}
                          type="number"
                          id="aiCredits"
                          placeholder={t('AI Credits')}
                          className="rounded-sm pr-16"
                        />
                        {!field.disabled && (
                          <Button
                            variant="link"
                            type="button"
                            tabIndex={-1}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-xs px-2 py-1 h-7"
                            onClick={() => form.setValue('aiCredits', '')}
                          >
                            {t('Clear')}
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {platform.plan.embeddingEnabled &&
              platformRole === PlatformRole.ADMIN && (
                <FormField
                  name="externalId"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="externalId">{t('External ID')}</Label>
                      <FormDescription>
                        {t(
                          'Used to identify the project based on your SaaS ID',
                        )}
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

            {checkAccess(Permission.WRITE_PROJECT) && (
              <DialogFooter className="justify-end mt-6">
                <Button type="submit">{t('Save')}</Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
