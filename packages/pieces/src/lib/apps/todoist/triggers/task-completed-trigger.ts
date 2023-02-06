import dayjs from 'dayjs';
import { assertNotNullOrUndefined } from '../../../common/helpers/assertions'
import { createTrigger, TriggerStrategy } from '../../../framework/trigger/trigger'
import { todoistSyncClient } from '../common/client/sync-client'
import { TodoistCompletedTask } from '../common/models'
import { todoistAuthentication, todoistProjectIdDropdown } from '../common/props'

export const todoistTaskCompletedTrigger = createTrigger({
  name: 'task_completed',
  displayName: 'Task completed',
  description: 'Triggers when a new task is completed',
  type: TriggerStrategy.POLLING,

  sampleData: {
    'content': 'Buy Milk',
    'meta_data': null,
    'user_id': '2671355',
    'task_id': '2995104339',
    'note_count': 0,
    'project_id': '2203306141',
    'section_id': '7025',
    'completed_at': '2015-02-17T15:40:41.000000Z',
    'id': '1899066186'
  },

  props: {
    authentication: todoistAuthentication,
    projectId: todoistProjectIdDropdown,
  },

  async onEnable(): Promise<void> {
  },

  async onDisable(): Promise<void> {
  },

  async run({ propsValue }): Promise<TodoistCompletedTask[]> {
    const token = propsValue.authentication?.access_token
    const { projectId } = propsValue

    assertNotNullOrUndefined(token, 'token')

    const fiveMinutesAgo = dayjs().subtract(5, 'minutes').format('YYYY-MM-DDTHH:mm:ss')

    const response = await todoistSyncClient.completed.list({
      token,
      since: fiveMinutesAgo,
      projectId,
    })

    return response.items;
  },
})
