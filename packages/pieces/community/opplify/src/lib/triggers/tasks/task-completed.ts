import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const taskCompleted = createOpplifyTrigger({
  name: 'task_completed',
  displayName: 'Task Completed',
  description: 'Triggers when a task is marked as done.',
  eventType: 'task_completed',
  props: {},
  sampleData: SAMPLE_DATA.task_completed,
});
