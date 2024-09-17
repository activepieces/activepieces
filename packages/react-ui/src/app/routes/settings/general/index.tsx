import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';

import { FlagGuard } from '@/app/components/flag-guard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { projectApi } from '@/lib/project-api';
import {
  ApFlagId,
  ProjectMemberRole,
  ProjectWithLimits,
} from '@activepieces/shared';

export default function GeneralPage() {
  const queryClient = useQueryClient();
  const { project, updateProject } = projectHooks.useCurrentProject();
  const { role } = useAuthorization();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      displayName: project?.displayName,
      plan: {
        tasks: project?.plan?.tasks,
        aiTokens: project?.plan?.aiTokens,
      },
    },
    disabled: role !== ProjectMemberRole.ADMIN,
    resolver: typeboxResolver(ProjectWithLimits),
  });

  const mutation = useMutation<
    ProjectWithLimits,
    Error,
    {
      displayName: string;
      plan: { tasks: number; aiTokens?: number };
    }
  >({
    mutationFn: (request) => {
      updateProject(queryClient, request);
      return projectApi.update(authenticationSession.getProjectId()!, request);
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
    },
    onError: (error) => {
      toast(INTERNAL_ERROR_TOAST);
      console.log(error);
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>{t('General')}</CardTitle>
        <CardDescription>
          {t('Manage general settings for your project.')}
        </CardDescription>
        {role !== ProjectMemberRole.ADMIN && (
          <p>
            <span className="text-destructive">*</span>{' '}
            {t('Only project admins can change this setting.')}
          </p>
        )}
      </CardHeader>
      <CardContent className="grid gap-1 mt-4">
        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
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
            </FlagGuard>
            <FlagGuard flag={ApFlagId.PROJECT_LIMITS_ENABLED}>
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
                          e.target.value ? parseInt(e.target.value) : undefined,
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
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        {role === ProjectMemberRole.ADMIN && (
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
      </CardContent>
    </Card>
  );
}
