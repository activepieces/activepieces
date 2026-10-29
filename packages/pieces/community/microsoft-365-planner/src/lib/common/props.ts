import { DropdownState, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from './api';

function groupId<R extends boolean>({
  required,
  displayName = 'Group',
  description = 'Select the Grroup',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoft365PlannerAuth,
    displayName,
    description,
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please select an authentication first',
        });
      }
      const groups = await microsoft365PlannerApi.listGroups({ auth });
      return {
        options: groups.map((group) => ({
          label: group.displayName ?? '',
          value: group.id ?? '',
        })),
        disabled: false,
        placeholder: 'Select a group',
      };
    },
  });
}

function planId<R extends boolean>({
  required,
  displayName = 'Plan',
  description = 'Select the plan',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoft365PlannerAuth,
    displayName,
    description,
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please select an authentication first',
        });
      }
      const plans = await microsoft365PlannerApi.listPlans({ auth });
      return {
        options: plans.map((plan) => ({
          label: plan.title ?? '',
          value: plan.id ?? '',
        })),
        disabled: false,
        placeholder: 'Select a plan',
      };
    },
  });
}

function bucketId<R extends boolean>({
  required,
  displayName = 'Bucket',
  description = 'Select the bucket',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoft365PlannerAuth,
    displayName,
    description,
    required,
    refreshers: ['auth', 'planId'],
    options: async ({ auth, planId }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please select an authentication first',
        });
      }
      if (!planId) {
        return disabledOptions({ placeholder: 'Please select a plan first' });
      }
      const buckets = await microsoft365PlannerApi.listBuckets({
        auth,
        planId: String(planId),
      });
      return {
        options: buckets.map((bucket) => ({
          label: bucket.name ?? '',
          value: bucket.id ?? '',
        })),
        disabled: false,
        placeholder: 'Select a bucket',
      };
    },
  });
}

function taskId<R extends boolean>({
  required,
  displayName = 'Task',
  description = 'Select the task',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoft365PlannerAuth,
    displayName,
    description,
    required,
    refreshers: ['auth', 'planId'],
    options: async ({ auth, planId }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please select an authentication first',
        });
      }
      if (!planId) {
        return disabledOptions({ placeholder: 'Please select a plan first' });
      }
      const tasks = await microsoft365PlannerApi.listTasks({
        auth,
        planId: String(planId),
      });
      return {
        options: tasks.map((task) => ({
          label: task.title ?? '',
          value: task.id ?? '',
        })),
        disabled: false,
        placeholder: 'Select a task',
      };
    },
  });
}

function assignments<R extends boolean>({
  required,
  displayName = 'Assignments',
  description = 'Select users to assign the task to. If left empty, the task will be unassigned.',
}: PropParams<R>) {
  return Property.MultiSelectDropdown({
    auth: microsoft365PlannerAuth,
    displayName,
    description,
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please select an authentication first',
        });
      }
      const users = await microsoft365PlannerApi.listUsers({ auth });
      return {
        options: users.map((user) => ({
          label: user.displayName || user.userPrincipalName || 'No Name',
          value: user.id || '',
        })),
        disabled: false,
        placeholder: 'Select users to assign the task to',
      };
    },
  });
}

function orderHint<R extends boolean>({
  required,
  displayName = 'Order Hint',
  description = 'Hint used to order items of this type in a list. The format is defined as outlined here: https://learn.microsoft.com/en-us/graph/api/resources/planner-order-hint-format?view=graph-rest-1.0',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function disabledOptions({
  placeholder,
}: {
  placeholder: string;
}): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const microsoft365PlannerProps = {
  groupId,
  planId,
  bucketId,
  taskId,
  assignments,
  orderHint,
};

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
