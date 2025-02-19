import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';

import { FlagGuard } from '@/app/components/flag-guard';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { projectApi } from '@/lib/project-api';
import {
  ApErrorParams,
  ApFlagId,
  ErrorCode,
  Permission,
  PlatformRole,
  ProjectWithLimits,
} from '@activepieces/shared';

export default function GeneralPage() {
  const queryClient = useQueryClient();
  const { project, updateCurrentProject } = projectHooks.useCurrentProject();

  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const { toast } = useToast();
  const platformRole = userHooks.getCurrentUserPlatformRole();

  const form = useForm({
    defaultValues: {
      displayName: project?.displayName,
      externalId: project?.externalId,
      plan: {
        tasks: project?.plan?.tasks ?? undefined,
        aiTokens: project?.plan?.aiTokens ?? undefined,
      },
    },
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
    resolver: typeboxResolver(ProjectWithLimits),
  });

  const mutation = useMutation<
    ProjectWithLimits,
    Error,
    {
      displayName: string;
      externalId?: string;
      plan: { tasks: number | undefined; aiTokens?: number | undefined };
    }
  >({
    mutationFn: (request) => {
      updateCurrentProject(queryClient, request);
      return projectApi.update(authenticationSession.getProjectId()!, {
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
            console.log(error);
            toast(INTERNAL_ERROR_TOAST);
            break;
          }
        }
      }
    },
  });

  return (
    <div className="flex flex-col items-center  gap-4">
      <div className="space-y-6 w-full">
        <div>
          <h3 className="text-xl font-semibold">{t('General')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('Manage general settings for your project.')}
          </p>
        </div>
        <Separator />
        <div className="grid gap-1 mt-4">
          <Form {...form}>
            <form
              className="grid space-y-4"
              onSubmit={(e) => e.preventDefault()}
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
                      <Label htmlFor="plan.tasks">{t('Tasks')}</Label>
                      <Input
                        type="number"
                        {...field}
                        required
                        id="plan.tasks"
                        placeholder={t('Tasks')}
                        className="rounded-sm"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="plan.aiTokens"
                  render={({ field }) => (
                    <FormItem className="grid space-y-2">
                      <Label htmlFor="plan.aiTokens">{t('AI Credits')}</Label>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                        id="plan.aiTokens"
                        placeholder={t('AI Credits')}
                        className="rounded-sm"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FlagGuard>
              {platform.embeddingEnabled &&
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
            </form>
          </Form>
          {checkAccess(Permission.WRITE_PROJECT) && (
            <div className="flex gap-2 justify-end mt-4">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  mutation.mutate(form.getValues());
                }}
              >
                {t('Save')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
