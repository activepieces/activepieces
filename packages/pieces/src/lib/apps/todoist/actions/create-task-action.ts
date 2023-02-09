import { assertNotNullOrUndefined } from '../../../common/helpers/assertions';
import { createAction } from '../../../framework/action/action';
import { Property } from '../../../framework/property';
import { todoistRestClient } from '../common/client/rest-client';
import { todoistAuthentication, todoistProjectIdDropdown } from '../common/props';

export const todoistCreateTaskAction = createAction({
  name: 'create_task',
  displayName: 'Create task',
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
      required: true,
    }),
  },

  async run({ propsValue }) {
    const token = propsValue.authentication?.access_token;
    const { project_id, content } = propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(content, 'content');

    return await todoistRestClient.tasks.create({
      token,
      project_id,
      content,
    });
  },
});
