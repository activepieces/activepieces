import { ARTEEMIS_EVENTS } from '../common/events';
import { arteemisEventTrigger } from '../common/event-trigger';

export const newTask = arteemisEventTrigger({
  name: 'task_created',
  event: ARTEEMIS_EVENTS.TASK_CREATED,
  displayName: 'New Task',
  description: 'Triggers when a task opens: a reply to answer, a call, a to-do, or a campaign message waiting for approval.',
  aiDescription:
    'Fires once per task opened in Arteemis: a reply to answer, a call, a to-do or a campaign message held for approval (task_kind reply, call, todo or approve), with the contact and campaign it is about.',
});
