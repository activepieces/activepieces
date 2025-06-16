import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';

import { FlagGuard } from '@/app/components/flag-guard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { OptionalNumber } from '@/components/ui/optional-number';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import {
  ApFlagId,
  isNil,
  Permission,
  PlatformRole,
} from '@activepieces/shared';

const updateProjectFormSchema = Type.Object({
  displayName: Type.String({
    minLength: 1,
    errorMessage: t('This field is required'),
  }),
  externalId: Type.Optional(Type.String()),
  plan: Type.Object({
    tasks: Type.String({
      minLength: 1,
      errorMessage: t('This field is required'),
    }),
    aiCredits: Type.String({
      minLength: 1,
      errorMessage: t('This field is required'),
    }),
  }),
});

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({
  open,
  onOpenChange,
}: EditProjectDialogProps) {
  const { project } = projectHooks.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const updateProjectMutation = projectHooks.useUpdateProject();

  const form = useForm<Static<typeof updateProjectFormSchema>>({
    defaultValues: {
      displayName: project?.displayName,
      externalId: project?.externalId,
      plan: {
        tasks: project?.plan?.tasks?.toString() ?? undefined,
        aiCredits: project?.plan?.aiCredits?.toString() ?? undefined,
      },
    },
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
    resolver: typeboxResolver(updateProjectFormSchema),
  });



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('Edit Project')}</DialogTitle>
          <DialogDescription>
            {t('Update your project settings and configuration.')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div
            className="grid space-y-4"
          >
            <FormField
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="displayName">{t('Project Name')}</Label>
                  <Input
                    {...field}
                    required
                    id="displayName"
                    placeholder={t('Project Name')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FlagGuard flag={ApFlagId.PROJECT_LIMITS_ENABLED}>
              <FormField
                name="plan.tasks"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Label htmlFor="plan.tasks">{t('Tasks Limit')}</Label>
                    <OptionalNumber
                      name="plan.tasks"
                      placeholder="1000"
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="plan.aiCredits"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Label htmlFor="plan.aiCredits">{t('AI Credits Limit')}</Label>
                    <OptionalNumber
                      name="plan.aiCredits"
                      placeholder="100"
                      className="rounded-sm"
                    />
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
                    <FormItem className="grid space-y-2">
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
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            {checkAccess(Permission.WRITE_PROJECT) && (
              <div className="flex gap-2 justify-end mt-4">
                <Button type="submit" onClick={() => {
                  const values = form.getValues();
                  updateProjectMutation.mutate({
                    displayName: values.displayName,
                    externalId: values.externalId,
                    plan: {
                      tasks: isNil(values.plan.tasks) ? undefined : parseInt(values.plan.tasks),
                      aiCredits: isNil(values.plan.aiCredits) ? undefined : parseInt(values.plan.aiCredits),
                    },
                  });
                  onOpenChange(false);
                }}>{t('Save')}</Button>
              </div>
            )}
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 