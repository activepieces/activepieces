import { UpdateProjectPlatformRequest } from '@activepieces/ee-shared';
import { ProjectWithLimits } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { billingApi } from '../api/billing-api';
import { planNameFormatter } from '../utils/plan-name-formatter';

import { PlanData } from './plan-data';
import { TasksProgress } from './tasks-progress';

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { projectHooks } from '@/hooks/project-hooks';
import { HttpError } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { projectApi } from '@/lib/project-api';

const TasksSchema = Type.Object({
  tasks: Type.Number(),
});

type TasksSchema = Static<typeof TasksSchema>;

const fetchSubscriptionInfo = async () => {
  return await billingApi.getSubscription();
};

const Plans: React.FC = () => {
  const { data: subscriptionData } = useQuery({
    queryKey: ['billing-subssription-information'],
    queryFn: fetchSubscriptionInfo,
  });

  const { data: projectData } = projectHooks.useCurrentProject();

  const form = useForm<TasksSchema>({
    resolver: typeboxResolver(TasksSchema),
  });

  useEffect(() => {
    if (projectData?.plan.tasks) {
      form.reset({ tasks: projectData.plan.tasks });
    }
  }, [projectData, form]);

  const { mutate: manageBilling, isPending: isBillingPending } = useMutation({
    mutationFn: billingApi.portalLink,
    onSuccess: ({ portalLink }) => (window.location.href = portalLink),
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const onManageBillingClick = () => manageBilling();

  const { mutate: updateLimitsData, isPending: isUpdateLimitsPending } =
    useMutation<ProjectWithLimits, HttpError, UpdateProjectPlatformRequest>({
      mutationFn: (request) =>
        projectApi.update(authenticationSession.getProjectId(), request),
      onSuccess: () =>
        toast({
          title: 'Success',
          description: 'Your changes have been saved.',
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
        <h1 className="text-3xl font-bold">Your Automation Plan</h1>
        <div className="ml-auto"></div>
      </div>
      {projectData && subscriptionData && (
        <>
          <div className="border-2 h-48 rounded-md grid grid-cols-4 divide-x">
            <TasksProgress
              usage={projectData.usage.tasks}
              plan={projectData.plan.tasks}
              nextBillingDate={subscriptionData.nextBillingDate}
            />
            <div className="flex flex-row items-center justify-center">
              <span>{planNameFormatter(projectData.plan.name)}</span>
            </div>
            <PlanData
              minimumPollingInterval={projectData.plan.minimumPollingInterval}
              includedUsers={subscriptionData.subscription.includedUsers}
              includedTasks={subscriptionData.subscription.includedTasks}
            />
            <div className="flex flex-col items-center justify-center">
              <Button
                loading={isBillingPending}
                onClick={onManageBillingClick}
                variant={
                  subscriptionData.subscription.subscriptionStatus === 'active'
                    ? 'default'
                    : 'outline'
                }
              >
                {subscriptionData.subscription.subscriptionStatus === 'active'
                  ? 'Manage Billing'
                  : 'Add Payment Details'}
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
                    <Label htmlFor="tasks">Hard Task Limit</Label>
                    <Input
                      {...field}
                      required
                      id="tasks"
                      type="number"
                      placeholder="15000"
                      className="rounded-sm w-1/4"
                      max={200000}
                      min={1}
                      onChange={(e) => field.onChange(+e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">
                      The maximum number of tasks that can be run in a month. If
                      you exceed the limit, the tasks will fail. This is useful
                      to prevent unexpected costs.
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
                Save
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
