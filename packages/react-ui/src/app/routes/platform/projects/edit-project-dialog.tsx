import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';

import { FlagGuard } from '@/app/components/flag-guard';
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
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { Permission, PlatformRole, ApFlagId } from '@activepieces/shared';

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
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
  initialValues,
}: EditProjectDialogProps) {
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const queryClient = useQueryClient();
  const { updateCurrentProject } = projectHooks.useCurrentProject();

  const form = useForm<FormValues>({
    defaultValues: {
      projectName: initialValues?.projectName,
      tasks: initialValues?.tasks || '',
      aiCredits: initialValues?.aiCredits || '',
      externalId: initialValues?.externalId,
    },
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const request = {
        displayName: values.projectName,
        externalId:
          values.externalId?.trim() !== '' ? values.externalId : undefined,
        plan: {
          tasks: parseInt(values.tasks),
          aiCredits: parseInt(values.aiCredits),
        },
      };
      updateCurrentProject(queryClient, request);
      onClose();
      return Promise.resolve();
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
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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

            <FlagGuard flag={ApFlagId.PROJECT_LIMITS_ENABLED}>
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
                      <Button
                        variant="link"
                        type="button"
                        tabIndex={-1}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-xs px-2 py-1 h-7"
                        onClick={() => form.setValue('tasks', '')}
                      >
                        {t('Clear')}
                      </Button>
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
                      <Button
                        variant="link"
                        type="button"
                        tabIndex={-1}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-xs px-2 py-1 h-7"
                        onClick={() => form.setValue('aiCredits', '')}
                      >
                        {t('Clear')}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FlagGuard>

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
