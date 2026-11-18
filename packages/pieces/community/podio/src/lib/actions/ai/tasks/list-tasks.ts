import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioListTasksOutputSchema } from '../../../output-schemas';

export const listTasksAction = createAction({
  auth: podioAuth,
  name: 'podio_list_tasks',
  outputSchema: podioListTasksOutputSchema,
  displayName: 'List Tasks',
  description: 'Lists tasks matching filters such as workspace, app, responsible user or reference.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Podio tasks matching all given filters, one page at a time with Limit and Offset. At least one of Organization IDs, Space IDs, App IDs, Responsible, Reference, Created By or Completed By is required. Org ids come from List Organizations, space ids from List Org Spaces, user ids from List Space Members.',
    idempotent: true,
  },
  props: {
    org: podioAiProps.text({ required: false, displayName: 'Organization IDs', description: 'Only tasks in these organizations: one id, or several separated by semicolons.' }),
    space: podioAiProps.text({ required: false, displayName: 'Space IDs', description: 'Only tasks in these workspaces: one id, or several separated by semicolons.' }),
    app: podioAiProps.text({ required: false, displayName: 'App IDs', description: 'Only tasks on items of these apps: one id, or several separated by semicolons.' }),
    responsible: podioAiProps.text({ required: false, displayName: 'Responsible', description: 'Only tasks these users are responsible for: one user id, or several separated by semicolons.' }),
    reference: podioAiProps.text({ required: false, displayName: 'Reference', description: 'Only tasks linked to these objects, as "type:id" separated by semicolons, such as "item:123;status:456".' }),
    createdBy: podioAiProps.text({ required: false, displayName: 'Created By', description: 'Only tasks created by these entities, as "type:id" separated by semicolons, such as "user:123".' }),
    completedBy: podioAiProps.text({ required: false, displayName: 'Completed By', description: 'Only tasks completed by these entities, as "type:id" separated by semicolons, such as "user:123".' }),
    completed: podioAiProps.bool({ required: false, displayName: 'Completed', description: '"true" returns only completed tasks, "false" only open ones. Unset returns both.' }),
    completedOn: podioAiProps.text({ required: false, displayName: 'Completed On', description: 'Date range the tasks were completed in, as "YYYY-MM-DD-YYYY-MM-DD".' }),
    createdOn: podioAiProps.text({ required: false, displayName: 'Created On', description: 'Date range the tasks were created in, as "YYYY-MM-DD-YYYY-MM-DD".' }),
    createdVia: podioAiProps.id({ required: false, displayName: 'Created Via', description: 'The id of the client the tasks were created through.' }),
    dueDate: podioAiProps.text({ required: false, displayName: 'Due Date', description: 'Date range the tasks are due in, as "YYYY-MM-DD-YYYY-MM-DD".' }),
    externalId: podioAiProps.text({ required: false, displayName: 'External ID', description: 'Only the task with this external id.' }),
    files: podioAiProps.bool({ required: false, displayName: 'Has Files', description: '"true" returns only tasks with files, "false" only tasks without. Unset returns both.' }),
    label: podioAiProps.id({ required: false, displayName: 'Label ID', description: 'Only tasks with this label, from List Task Labels.' }),
    reassigned: podioAiProps.bool({ required: false, displayName: 'Reassigned', description: '"true" returns only tasks the connected user assigned to someone else, "false" only the others.' }),
    grouping: podioAiProps.choice({ required: false, displayName: 'Grouping', description: 'Adds a "group" value to each task by this field.', values: ['due_date', 'created_by', 'responsible', 'app', 'space', 'org'] }),
    sortBy: podioAiProps.choice({ required: false, displayName: 'Sort By', description: 'The sort order. Defaults to "rank".', values: ['rank', 'created_on', 'completed_on'] }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending. Defaults to "false".' }),
    view: podioAiProps.text({ required: false, displayName: 'View', description: 'Set to "full" to return every task field, as Get Task does.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of tasks to return. Defaults to 100.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { org, space, app, responsible, reference, createdBy, completedBy } = propsValue;
    if (!org && !space && !app && !responsible && !reference && !createdBy && !completedBy) {
      throw new Error('Set at least one of Organization IDs, Space IDs, App IDs, Responsible, Reference, Created By or Completed By: Podio rejects a task list that is not filtered by one of them.');
    }
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/task/',
      query: podioUtils.query({
        values: {
          org,
          space,
          app,
          responsible,
          reference,
          created_by: createdBy,
          completed_by: completedBy,
          completed: podioUtils.toBool({ value: propsValue.completed }),
          completed_on: propsValue.completedOn,
          created_on: propsValue.createdOn,
          created_via: propsValue.createdVia,
          due_date: propsValue.dueDate,
          external_id: propsValue.externalId,
          files: podioUtils.toBool({ value: propsValue.files }),
          label: propsValue.label,
          reassigned: podioUtils.toBool({ value: propsValue.reassigned }),
          grouping: propsValue.grouping,
          sort_by: propsValue.sortBy,
          sort_desc: podioUtils.toBool({ value: propsValue.sortDesc }),
          view: propsValue.view,
          limit: propsValue.limit ?? 100,
          offset: propsValue.offset,
        },
      }),
    });
    return { tasks: body, count: body.length };
  },
});
