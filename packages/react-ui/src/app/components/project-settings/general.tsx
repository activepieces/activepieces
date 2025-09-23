import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';
import { projectApi } from '@/lib/project-api';
import {
  ApErrorParams,
  ErrorCode,
  PlatformRole,
  ProjectWithLimits,
} from '@activepieces/shared';

export const GeneralSettings = ({
  form,
  projectId,
}: {
  form: any;
  projectId?: string;
  initialValues?: any;
}) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const queryClient = useQueryClient();
  const { updateCurrentProject } = projectHooks.useCurrentProject();
  const { toast } = useToast();

  const projectMutation = useMutation<
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
      return projectApi.update(projectId!, {
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
            toast(INTERNAL_ERROR_TOAST);
            break;
          }
        }
      }
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {t('Project Configuration')}
        </CardTitle>
        <CardDescription className="text-sm">
          {t('Manage your project settings and limits.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            <FormField
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="projectName" className="text-sm font-medium">
                    {t('Project Name')}
                  </Label>
                  <Input
                    {...field}
                    id="projectName"
                    placeholder={t('Project Name')}
                    className="h-9"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {false && platform.plan.manageProjectsEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="tasks"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="tasks" className="text-sm font-medium">
                        {t('Tasks')}
                      </Label>
                      <div className="relative">
                        <Input
                          {...field}
                          type="number"
                          id="tasks"
                          placeholder={t('Tasks')}
                          className="h-9 pr-16"
                        />
                        {!field.disabled && (
                          <Button
                            variant="ghost"
                            type="button"
                            tabIndex={-1}
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
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
                      <Label
                        htmlFor="aiCredits"
                        className="text-sm font-medium"
                      >
                        {t('AI Credits')}
                      </Label>
                      <div className="relative">
                        <Input
                          {...field}
                          type="number"
                          id="aiCredits"
                          placeholder={t('AI Credits')}
                          className="h-9 pr-16"
                        />
                        {!field.disabled && (
                          <Button
                            variant="ghost"
                            type="button"
                            tabIndex={-1}
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
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
              </div>
            )}

            {platform.plan.embeddingEnabled &&
              platformRole === PlatformRole.ADMIN && (
                <FormField
                  name="externalId"
                  render={({ field }) => (
                    <FormItem>
                      <Label
                        htmlFor="externalId"
                        className="text-sm font-medium"
                      >
                        {t('External ID')}
                      </Label>
                      <FormDescription className="text-xs">
                        {t(
                          'Used to identify the project based on your SaaS ID',
                        )}
                      </FormDescription>
                      <Input
                        {...field}
                        id="externalId"
                        placeholder={t('org-3412321')}
                        className="h-9 font-mono"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            <div className="pt-2 flex justify-end">
              <Button
                disabled={projectMutation.isPending}
                size="sm"
                onClick={form.handleSubmit((values: any) =>
                  projectMutation.mutate({
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
                {projectMutation.isPending ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    {t('Saving...')}
                  </>
                ) : (
                  t('Save Changes')
                )}
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};
