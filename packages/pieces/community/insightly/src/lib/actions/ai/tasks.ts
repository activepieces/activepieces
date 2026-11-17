import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { InsightlyError, insightlyUtils } from '../../common/client';
import { insightlyAuth, insightlyCommon } from '../../common/common';
import { insightlyMappers, outputSchemas } from '../../common/output-schemas';
import { aiProps, LINKABLE_OBJECT_OPTIONS, TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../../common/props';

export const aiCreateTask = createAction({
  auth: insightlyAuth,
  name: 'ai_create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Create a task, optionally linked to a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an Insightly task (owner defaults to the connected user) and optionally links it to a contact, lead, opportunity, organization or project. Not idempotent: each call creates another task, so check Find Tasks first. User IDs come from Find User.',
    idempotent: false,
  },
  outputSchema: outputSchemas['task'],
  props: {
    title: Property.ShortText({ displayName: 'Title', required: true }),
    dueDate: Property.ShortText({ displayName: 'Due Date', description: 'ISO date, e.g. 2026-12-01.', required: false }),
    details: Property.LongText({ displayName: 'Details', required: false }),
    priority: Property.StaticDropdown<string, false>({ displayName: 'Priority', required: false, options: { options: TASK_PRIORITY_OPTIONS } }),
    ownerUserId: Property.Number({ displayName: 'Owner User ID', required: false }),
    responsibleUserId: Property.Number({ displayName: 'Assigned User ID', required: false }),
    linkObject: Property.StaticDropdown<string, false>({ displayName: 'Link To Object Type', required: false, options: { options: LINKABLE_OBJECT_OPTIONS } }),
    linkId: Property.Number({ displayName: 'Link To Record ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const linkObject = insightlyUtils.optionalText(propsValue.linkObject);
    const linkId = propsValue.linkId === undefined || propsValue.linkId === null ? undefined : insightlyUtils.toId({ value: propsValue.linkId, label: 'Link To Record ID' });
    if ((linkObject === undefined) !== (linkId === undefined)) {
      throw new Error('Provide both Link To Object Type and Link To Record ID, or neither.');
    }
    const connection = await insightlyCommon.connect({ auth });
    const linkTarget = linkObject !== undefined && linkId !== undefined ? { linkObject, linkId, objectName: LINK_OBJECT_PATHS[linkObject] } : null;
    if (linkTarget) {
      if (!linkTarget.objectName) {
        throw new InsightlyError({ message: `Unsupported link object type "${linkTarget.linkObject}".`, status: 400 });
      }
      await insightlyCommon.call({ connection, method: HttpMethod.GET, path: `/${linkTarget.objectName}/${linkTarget.linkId}` });
    }
    const ownerId =
      propsValue.ownerUserId ?? insightlyUtils.readNumber(insightlyUtils.sanitizeRecord(await insightlyCommon.call({ connection, method: HttpMethod.GET, path: '/Users/Me' }))['USER_ID']);
    const task = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({
        connection,
        method: HttpMethod.POST,
        path: '/Tasks',
        body: insightlyUtils.compact({
          TITLE: propsValue.title,
          DUE_DATE: propsValue.dueDate,
          DETAILS: propsValue.details,
          PRIORITY: insightlyUtils.readNumber(propsValue.priority),
          STATUS: 'NOT STARTED',
          COMPLETED: false,
          OWNER_USER_ID: ownerId,
          RESPONSIBLE_USER_ID: propsValue.responsibleUserId,
        }),
      }),
    );
    const taskId = insightlyUtils.readNumber(task['TASK_ID']);
    if (linkTarget) {
      if (taskId === null) {
        throw new InsightlyError({ message: 'Insightly created the task but returned no ID, so it could not be linked.', status: 502 });
      }
      try {
        await insightlyCommon.call({ connection, method: HttpMethod.POST, path: `/Tasks/${taskId}/Links`, body: { LINK_OBJECT_NAME: linkTarget.linkObject, LINK_OBJECT_ID: linkTarget.linkId } });
      } catch (error) {
        const cause = insightlyUtils.toInsightlyError(error);
        throw new InsightlyError({ message: `Task ${taskId} was created, but linking it failed: ${cause.message}`, status: cause.status, responseBody: cause.responseBody });
      }
    }
    return insightlyMappers.task(task);
  },
});

export const aiCompleteTask = createAction({
  auth: insightlyAuth,
  name: 'ai_complete_task',
  classification: 'WRITE',
  displayName: 'Complete Task',
  description: 'Mark a task as completed.',
  audience: 'ai',
  aiMetadata: {
    description: 'Marks an Insightly task as completed (status COMPLETED, 100%). Safe to repeat: a completed task stays completed. Get the task ID from Find Tasks.',
    idempotent: true,
  },
  outputSchema: outputSchemas['task'],
  props: {
    taskId: Property.Number({ displayName: 'Task ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const taskId = insightlyUtils.toId({ value: propsValue.taskId, label: 'Task ID' });
    const connection = await insightlyCommon.connect({ auth });
    const task = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({ connection, method: HttpMethod.PUT, path: '/Tasks', body: { TASK_ID: taskId, STATUS: 'COMPLETED', COMPLETED: true, PERCENT_COMPLETE: 100 } }),
    );
    return insightlyMappers.task(task);
  },
});

export const aiFindTasks = createAction({
  auth: insightlyAuth,
  name: 'ai_find_tasks',
  classification: 'SEARCH',
  displayName: 'Find Tasks',
  description: 'Find tasks by exact title or status.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches Insightly tasks by exact title, or by status when no title is given; lists tasks when neither is given. Returns task IDs, status, due date and owner. Read-only and safe to repeat.',
    idempotent: true,
  },
  outputSchema: outputSchemas['taskList'],
  props: {
    title: Property.ShortText({ displayName: 'Title', required: false }),
    status: Property.StaticDropdown<string, false>({ displayName: 'Status', required: false, options: { options: TASK_STATUS_OPTIONS } }),
    limit: aiProps.limit(),
  },
  async run({ auth, propsValue }) {
    const title = insightlyUtils.optionalText(propsValue.title);
    const status = insightlyUtils.optionalText(propsValue.status);
    const limit = insightlyUtils.clampLimit(propsValue.limit);
    const filter = title ? { field: 'TITLE', value: title } : status ? { field: 'STATUS', value: status } : undefined;
    const scan = title !== undefined && status !== undefined;
    const connection = await insightlyCommon.connect({ auth });
    const page = await insightlyCommon.findRecords({ connection, objectName: 'Tasks', filter, limit: scan ? MAX_SCAN : limit });
    const tasks = page.records.map(insightlyMappers.task).filter((task) => !scan || (task.status ?? '').toUpperCase() === status);
    return { count: Math.min(tasks.length, limit), hasMore: page.hasMore || tasks.length > limit, tasks: tasks.slice(0, limit) };
  },
});

const MAX_SCAN = 500;
const LINK_OBJECT_PATHS: Record<string, string> = { Contact: 'Contacts', Lead: 'Leads', Opportunity: 'Opportunities', Organisation: 'Organisations', Project: 'Projects' };
