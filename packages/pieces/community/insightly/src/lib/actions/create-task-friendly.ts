import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../common/client';
import { insightlyAuth, insightlyCommon, podProperty } from '../common/common';
import { insightlyDropdowns } from '../common/dropdowns';
import { insightlyMappers, outputSchemas } from '../common/output-schemas';
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '../common/props';

export const createTaskFriendly = createAction({
  auth: insightlyAuth,
  name: 'create_task_friendly',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Create a task with owner, category and project pickers.',
  audience: 'human',
  outputSchema: outputSchemas['task'],
  props: {
    pod: podProperty(),
    title: Property.ShortText({ displayName: 'Title', required: true }),
    details: Property.LongText({ displayName: 'Details', required: false }),
    dueDate: Property.DateTime({ displayName: 'Due Date', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'NOT STARTED',
      options: { options: TASK_STATUS_OPTIONS },
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: { options: TASK_PRIORITY_OPTIONS },
    }),
    ownerUserId: insightlyDropdowns.userDropdown({ displayName: 'Owner' }),
    responsibleUserId: insightlyDropdowns.userDropdown({ displayName: 'Assigned To' }),
    categoryId: insightlyDropdowns.taskCategoryDropdown(),
    projectId: insightlyDropdowns.projectDropdown(),
  },
  async run(context) {
    const { pod, title, details, dueDate, status, priority, ownerUserId, responsibleUserId, categoryId, projectId } = context.propsValue;
    const connection = await insightlyCommon.connect({ auth: context.auth, pod });
    const ownerId = ownerUserId ?? insightlyUtils.readNumber(insightlyUtils.sanitizeRecord(await insightlyCommon.call({ connection, method: HttpMethod.GET, path: '/Users/Me' }))['USER_ID']);
    const task = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({
        connection,
        method: HttpMethod.POST,
        path: '/Tasks',
        body: insightlyUtils.compact({
          TITLE: title,
          DETAILS: details,
          DUE_DATE: dueDate,
          STATUS: status ?? 'NOT STARTED',
          PRIORITY: insightlyUtils.readNumber(priority),
          OWNER_USER_ID: ownerId,
          RESPONSIBLE_USER_ID: responsibleUserId,
          CATEGORY_ID: categoryId,
          PROJECT_ID: projectId,
          COMPLETED: status === 'COMPLETED',
        }),
      }),
    );
    return insightlyMappers.task(task);
  },
});
