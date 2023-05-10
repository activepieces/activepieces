import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-common';
import { todoistRestClient } from '../common/client/rest-client';
import { todoistAuthentication, todoistProjectIdDropdown } from '../common/props';
import { TodoistCreateTaskRequest } from '../common/models';

export const todoistCreateTaskAction = createAction({
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create task',
  sampleData: {
    'creator_id': '2671355',
    'created_at': '2019-12-11T22:36:50.000000Z',
    'assignee_id': null,
    'assigner_id': null,
    'comment_count': 0,
    'is_completed': false,
    'content': 'Buy Milk',
    'description': '',
    'due': {
      'date': '2016-09-01',
      'is_recurring': false,
      'datetime': '2016-09-01T12:00:00.000000Z',
      'string': 'tomorrow at 12',
      'timezone': 'Europe/Moscow'
    },
    'id': '2995104339',
    'labels': [],
    'order': 1,
    'priority': 4,
    'project_id': '2203306141',
    'section_id': null,
    'parent_id': null,
    'url': 'https://todoist.com/showTask?id=2995104339'
  },

  props: {
    authentication: todoistAuthentication,
    project_id: todoistProjectIdDropdown,
    content: Property.LongText({
      displayName: 'content',
      description: 'The task\'s content. It may contain some markdown-formatted text and hyperlinks',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description for the task. This value may contain some markdown-formatted text and hyperlinks.',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      required: false,
      description: 'The task\'s labels (a list of names that may represent either personal or shared labels)'
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description: 'Task priority from 1 (normal) to 4 (urgent)',
      required: false,
    }),
    due_date: Property.ShortText({
      displayName: 'Due date',
      description: 'Specific date in YYYY-MM-DD format relative to user\'s timezone',
      required: false,
    })
  },

  async run({ propsValue }) {
    const token = propsValue.authentication?.access_token;
    const { project_id, content, description, labels, priority, due_date } = propsValue as TodoistCreateTaskRequest;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(content, 'content');
    return await todoistRestClient.tasks.create({
      token,
      project_id,
      content,
      description,
      labels,
      priority,
      due_date
    });
  },
});
