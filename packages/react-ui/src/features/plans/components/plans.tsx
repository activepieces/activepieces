import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { projectHooks } from '@/hooks/project-hooks';
import { HttpError } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { projectApi } from '@/lib/project-api';
import {
  MAXIMUM_ALLOWED_TASKS,
  UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared';
import { ProjectWithLimits } from '@activepieces/shared';

import { useNewWindow } from '../../../components/embed-provider';
import { TableTitle } from '../../../components/ui/table-title';
import { billingApi } from '../api/billing-api';

import { TasksProgress } from './ai-credits-and-tasks-progress';
import { PlanData } from './plan-data';

const TasksSchema = Type.Object({
  tasks: Type.Number(),
});

type TasksSchema = Static<typeof TasksSchema>;

const fetchSubscriptionInfo = async () => {
  return await billingApi.getSubscription();
};

const planNameFormatter = (planName: string | undefined) => {
  if (!planName) {
    return 'Free Plan';
  }
  const free = planName.startsWith('free');
  if (free) {
    return 'Free Plan';
  }

  const pro =
    planName.startsWith('pro') ||
    planName.startsWith('growth') ||
    planName.startsWith('friends');
  if (pro) {
    return 'Pro Plan';
  }

  const ltd = planName.startsWith('ltd');
  if (ltd) {
    return 'Life Time Plan';
  }

  const unlimited = planName.startsWith('unlimited');
  if (unlimited) {
    return 'Unlimited Plan';
  }

  switch (planName) {
    case 'appsumo_activepieces_tier1':
      return 'AppSumo Tier 1';
    case 'appsumo_activepieces_tier2':
      return 'AppSumo Tier 2';
    case 'appsumo_activepieces_tier3':
      return 'AppSumo Tier 3';
    case 'appsumo_activepieces_tier4':
      return 'AppSumo Tier 4';
    case 'appsumo_activepieces_tier5':
      return 'AppSumo Tier 5';
    case 'appsumo_activepieces_tier6':
      return 'AppSumo Tier 6';
  }
  return planName;
};

const Plans: React.FC = () => {
  const { data: subscriptionData } = useQuery({
    queryKey: ['billing-subssription-information'],
    queryFn: fetchSubscriptionInfo,
  });

  const { project } = projectHooks.useCurrentProject();

  const form = useForm<TasksSchema>({
    resolver: typeboxResolver(TasksSchema),
  });

  useEffect(() => {
    if (project?.plan.tasks) {
      form.reset({ tasks: project.plan.tasks });
    }
  }, [project, form]);
  const openNewWindow = useNewWindow();
  const { mutate: manageBilling, isPending: isBillingPending } = useMutation({
    mutationFn: async () => {
      if (subscriptionData?.subscription.subscriptionStatus === 'active') {
        const { portalLink } = await billingApi.portalLink();
        openNewWindow(portalLink);
        return;
      }
      const { paymentLink } = await billingApi.upgrade();
      openNewWindow(paymentLink);
    },
    onSuccess: () => {},
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const { mutate: updateLimitsData, isPending: isUpdateLimitsPending } =
    useMutation<ProjectWithLimits, HttpError, UpdateProjectPlatformRequest>({
      mutationFn: (request) =>
        projectApi.update(authenticationSession.getProjectId()!, request),
      onSuccess: () =>
        toast({
          title: t('Success'),
          description: t('Your changes have been saved.'),
          duration: 3000,
        }),
      onError: () => toast(INTERNAL_ERROR_TOAST),
    });

  const updateLimits: SubmitHandler<{
    tasks: number;
  }> = (data) => {
    form.setError('root.serverError', {
      message: undefined,
    });
    updateLimitsData({
      plan: {
        tasks: data.tasks,
      },
    });
  };

  return (
    <div className="container mx-auto flex-col py-10">
      <div className="mb-4 flex">
        <TableTitle>{t('Your Automation Plan')}</TableTitle>
        <div className="ml-auto"></div>
      </div>
      {project && subscriptionData && (
        <>
          <div className="border-2 h-48 rounded-md grid grid-cols-4 divide-x ">
            <div className="flex  justify-center   ">
              <TasksProgress
                tasks={{
                  usage: project.usage.tasks,
                  plan: project.plan.tasks,
                }}
                aiTokens={{
                  usage: project.usage.aiTokens,
                  plan: project.plan.aiTokens,
                }}
                nextBillingDate={subscriptionData.nextBillingDate}
              />
            </div>

            <div className="flex flex-row items-center justify-center">
              <span>{planNameFormatter(project.plan.name)}</span>
            </div>
            <div className="flex justify-center">
              <PlanData
                minimumPollingInterval={project.plan.minimumPollingInterval}
                includedUsers={subscriptionData.subscription.includedUsers}
                includedTasks={subscriptionData.subscription.includedTasks}
              />
            </div>

            <div className="flex flex-col items-center justify-center">
              <Button
                loading={isBillingPending}
                onClick={() => manageBilling()}
                variant={
                  subscriptionData.subscription.subscriptionStatus === 'active'
                    ? 'default'
                    : 'outline'
                }
              >
                {subscriptionData.subscription.subscriptionStatus === 'active'
                  ? t('Manage Billing')
                  : t('Add Payment Details')}
              </Button>
            </div>
          </div>
          <Form {...form}>
            <form className="grid space-y-4 my-4">
              <FormField
                disabled={
                  subscriptionData.subscription.subscriptionStatus !== 'active'
                }
                control={form.control}
                name="tasks"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Label htmlFor="tasks">{t('Hard Task Limit')}</Label>
                    <Input
                      {...field}
                      required
                      id="tasks"
                      type="number"
                      placeholder={'15000'}
                      className="rounded-sm w-1/4"
                      max={MAXIMUM_ALLOWED_TASKS}
                      min={1}
                      onChange={(e) => field.onChange(+e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {t(
                        'The maximum number of tasks that can be run in a month. If you exceed the limit, the tasks will fail. This is useful to prevent unexpected costs.',
                      )}
                    </span>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="w-24"
                disabled={
                  subscriptionData.subscription.subscriptionStatus !== 'active'
                }
                loading={isUpdateLimitsPending}
                onClick={(e) => form.handleSubmit(updateLimits)(e)}
              >
                {t('Save')}
              </Button>
            </form>
          </Form>
        </>
      )}
    </div>
  );
};

Plans.displayName = 'Plans';

export { Plans };
