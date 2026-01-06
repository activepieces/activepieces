import { t } from 'i18next';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
import { projectCollectionUtils } from '@/hooks/project-collection';
import { userHooks } from '@/hooks/user-hooks';
import {
  Permission,
  PlatformRole,
  TeamProjectsLimit,
} from '@activepieces/shared';

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  initialValues?: {
    projectName?: string;
    aiCredits?: string;
    externalId?: string;
  };
  renameOnly?: boolean;
}

type FormValues = {
  projectName: string;
  aiCredits: string;
  externalId?: string;
};

export function EditProjectDialog({
  open,
  onClose,
  projectId,
  initialValues,
  renameOnly = false,
}: EditProjectDialogProps) {
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();

  const form = useForm<FormValues>({
    defaultValues: {
      projectName: initialValues?.projectName,
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogTitle>
          {renameOnly ? t('Rename Project') : t('Edit Project')}
        </DialogTitle>
        <p className="text-sm text-muted-foreground mb-4 mt-1">
          {renameOnly
            ? null
            : t('Update your project settings and configuration.')}
        </p>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              projectCollectionUtils.update(projectId, {
                displayName: values.projectName,
                externalId: values.externalId,
              });
              toast.success(t('Your changes have been saved.'), {
                duration: 3000,
              });
              onClose();
            })}
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

            {!renameOnly &&
              platform.plan.teamProjectsLimit !== TeamProjectsLimit.NONE && (
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
              )}

            {!renameOnly &&
              platform.plan.embeddingEnabled &&
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
