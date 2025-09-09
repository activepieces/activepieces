import { createAction, Property } from "@activepieces/pieces-framework";
import { copperAuth } from "../common/auth";
import { taskAssigneeId, taskCustomFields, taskDetails, taskDueDate, taskId, taskName, taskPriority, taskRelatedResource, taskReminderDate, taskStatus, taskTags } from "../common/task";
import { makeCopperRequest } from "../common/request";
import { HttpMethod } from "@activepieces/pieces-common";
import { TASKS_API_ENDPOINT } from "../common/constants";
import { projectId } from "../common/project";
import { opportunityId } from "../common/opportunity";

export const createTask = createAction({
    auth: copperAuth,
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a new Task in Copper.',
    props: {
      name: taskName,
      related_resource: taskRelatedResource,
      assignee_id: taskAssigneeId,
      due_date: taskDueDate,
      reminder_date: taskReminderDate,
      priority: taskPriority,
      status: taskStatus,
      details: taskDetails,
      tags: taskTags,
      custom_fields: taskCustomFields,
    },
    async run(context) {
      const { auth, propsValue } = context;
  
      const taskData = {
        name: propsValue.name,
        related_resource: propsValue.related_resource,
        assignee_id: propsValue.assignee_id,
        due_date: propsValue.due_date
          ? Math.floor(new Date(propsValue.due_date).getTime() / 1000)
          : undefined,
        reminder_date: propsValue.reminder_date
          ? Math.floor(new Date(propsValue.reminder_date).getTime() / 1000)
          : undefined,
        priority: propsValue.priority,
        status: propsValue.status,
        details: propsValue.details,
        tags: propsValue.tags,
        custom_fields: propsValue.custom_fields,
      };
  
      const payload = Object.fromEntries(
        Object.entries(taskData).filter(([, value]) => {
          if (Array.isArray(value)) return value.length > 0;
          return value != null;
        })
      );
  
      return await makeCopperRequest(
        HttpMethod.POST,
        TASKS_API_ENDPOINT,
        auth,
        payload
      );
    },
});

export const updateTask = createAction({
    auth: copperAuth,
    name: 'update_task',
    displayName: 'Update Task',
    description: 'Update an existing Task in Copper.',
    props: {
      id: taskId,
      name: { ...taskName, required: false },
      related_resource: taskRelatedResource,
      assignee_id: { ...taskAssigneeId, required: false },
      due_date: { ...taskDueDate, required: false },
      reminder_date: { ...taskReminderDate, required: false },
      priority: { ...taskPriority, required: false },
      status: { ...taskStatus, required: false },
      details: { ...taskDetails, required: false },
      tags: { ...taskTags, required: false },
      custom_fields: { ...taskCustomFields, required: false },
    },
    async run(context) {
      const { id, ...updateProps } = context.propsValue;
  
      const updateData = {
        ...updateProps,
        due_date: updateProps.due_date
          ? Math.floor(new Date(updateProps.due_date).getTime() / 1000)
          : updateProps.due_date,
        reminder_date: updateProps.reminder_date
          ? Math.floor(new Date(updateProps.reminder_date).getTime() / 1000)
          : updateProps.reminder_date,
      };
      
      const payload = Object.fromEntries(
        Object.entries(updateData).filter(([, value]) => value !== undefined)
      );
  
      return await makeCopperRequest(
        HttpMethod.PUT,
        `${TASKS_API_ENDPOINT}/${id}`,
        context.auth,
        payload
      );
    },
});

export const searchTask = createAction({
    auth: copperAuth,
    name: 'search_task',
    displayName: 'Search Task',
    description: 'Find a task in Copper and return the first matching result.',
    props: {
      task_id: { ...taskId, required: false },
      name: { ...taskName, required: false },
      project_id: projectId,
      opportunity_id: opportunityId,
      assignee_id: taskAssigneeId,
      statuses: taskStatus,
      tags: taskTags,
      followed: Property.StaticDropdown({
        displayName: 'Followed Status',
        description: 'Filter tasks by whether they are followed or not.',
        required: false,
        options: {
          options: [
            { label: 'Followed', value: 1 },
            { label: 'Not Followed', value: 2 },
          ],
        },
      }),
      minimum_due_date: {
        ...taskDueDate,
        displayName: 'Minimum Due Date',
        description: 'Filter tasks due on or after this date.',
        required: false,
      },
      maximum_due_date: {
        ...taskDueDate,
        displayName: 'Maximum Due Date',
        description: 'Filter tasks due on or before this date.',
        required: false,
      },
      minimum_created_date: Property.DateTime({
        displayName: 'Minimum Created Date',
        description: 'Filter tasks created on or after this date.',
        required: false,
      }),
      maximum_created_date: Property.DateTime({
        displayName: 'Maximum Created Date',
        description: 'Filter tasks created on or before this date.',
        required: false,
      }),
      minimum_modified_date: Property.DateTime({
        displayName: 'Minimum Modified Date',
        description: 'Filter tasks last modified on or after this date.',
        required: false,
      }),
      maximum_modified_date: Property.DateTime({
        displayName: 'Maximum Modified Date',
        description: 'Filter tasks last modified on or before this date.',
        required: false,
      }),
      custom_fields: {
        ...taskCustomFields,
        displayName: 'Custom Fields (Exact Value)',
        description: 'Filter tasks by exact values of custom fields.',
      },
    },
    async run(context) {
      const { auth, propsValue } = context;
  
      const searchFilters = {
        ids: propsValue.task_id != null ? [propsValue.task_id] : undefined,
        name: propsValue.name,
        assignee_ids: propsValue.assignee_id != null ? [propsValue.assignee_id] : undefined,
        project_ids: propsValue.project_id != null ? [propsValue.project_id] : undefined,
        opportunity_ids: propsValue.opportunity_id != null ? [propsValue.opportunity_id] : undefined,
        statuses: propsValue.statuses,
        tags: propsValue.tags && propsValue.tags.length > 0 ? { option: 'ANY', value: propsValue.tags } : undefined,
        followed: propsValue.followed,
        minimum_due_date: propsValue.minimum_due_date ? Math.floor(new Date(propsValue.minimum_due_date).getTime() / 1000) : undefined,
        maximum_due_date: propsValue.maximum_due_date ? Math.floor(new Date(propsValue.maximum_due_date).getTime() / 1000) : undefined,
        minimum_created_date: propsValue.minimum_created_date ? Math.floor(new Date(propsValue.minimum_created_date).getTime() / 1000) : undefined,
        maximum_created_date: propsValue.maximum_created_date ? Math.floor(new Date(propsValue.maximum_created_date).getTime() / 1000) : undefined,
        minimum_modified_date: propsValue.minimum_modified_date ? Math.floor(new Date(propsValue.minimum_modified_date).getTime() / 1000) : undefined,
        maximum_modified_date: propsValue.maximum_modified_date ? Math.floor(new Date(propsValue.maximum_modified_date).getTime() / 1000) : undefined,
        custom_fields: propsValue.custom_fields,
      };
  
      const activeFilters = Object.fromEntries(
        Object.entries(searchFilters).filter(([, value]) => {
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'object' && value !== null && 'option' in value) {
              return Array.isArray(value.value) && value.value.length > 0;
          }
          return value != null;
        })
      );
  
      const payload = {
        page_size: 1,
        ...activeFilters,
      };
  
      const response = await makeCopperRequest<any[]>(
        HttpMethod.POST,
        `${TASKS_API_ENDPOINT}/search`,
        auth,
        payload
      );
  
      return response?.[0] ?? null;
    },
});