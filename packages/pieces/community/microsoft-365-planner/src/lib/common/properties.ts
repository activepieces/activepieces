import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '.';

export const groupDropdown = ({ required = true }) =>
  Property.Dropdown({
    auth: microsoft365PlannerAuth,
    displayName: 'Group',
    description: 'Select the Grroup',
    required: required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          disabled: true,
          placeholder: 'Please select an authentication first',
        };
      }
      const groups = await microsoft365PlannerCommon.listGroups({ auth });
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

export const PlanDropdown = ({ required = true }) =>
  Property.Dropdown({
    auth: microsoft365PlannerAuth,
    displayName: 'Plan',
    description: 'Select the plan',
    required: required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          disabled: true,
          placeholder: 'Please select an authentication first',
        };
      }
      const plans = await microsoft365PlannerCommon.listPlans({ auth });
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

export const BucketDropdown = ({ required = true }) =>
  Property.Dropdown({
    auth: microsoft365PlannerAuth,
    displayName: 'Bucket',
    description: 'Select the bucket',
    required: required,
    refreshers: ['auth', 'planId'],
    options: async ({
      auth,
      planId,
    }: {
      auth?: OAuth2PropertyValue | null;
      planId?: string;
    }) => {
      if (!auth) {
        return {
          options: [],
          disabled: true,
          placeholder: 'Please select an authentication first',
        };
      }
      if (!planId) {
        return {
          options: [],
          disabled: true,
          placeholder: 'Please select a plan first',
        };
      }
      const buckets = await microsoft365PlannerCommon.listBuckets({
        auth,
        planId,
      });
      console.log("Buckets:", JSON.stringify(buckets));
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

export const TaskDropdown = ({ required = true }) =>
  Property.Dropdown({
    auth: microsoft365PlannerAuth,
    displayName: 'Task',
    description: 'Select the task',
    required: required,
    refreshers: ['auth', 'planId'],
    options: async ({
      auth,
      planId,
    }: {
      auth?: OAuth2PropertyValue | null;
      planId?: string;
    }) => {
      if (!auth) {
        return {
          options: [],
          disabled: true,
          placeholder: 'Please select an authentication first',
        };
      }
      if (!planId) {
        return {
          options: [],
          disabled: true,
          placeholder: 'Please select a plan first',
        };
      }
      const tasks = await microsoft365PlannerCommon.listTasks({
        auth,
        planId,
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

export const OrderHintProperty = ({ required = false }) =>
  Property.ShortText({
    displayName: 'Order Hint',
    description:
      'Hint used to order items of this type in a list. The format is defined as outlined here: https://learn.microsoft.com/en-us/graph/api/resources/planner-order-hint-format?view=graph-rest-1.0',
    required: required,
  });
