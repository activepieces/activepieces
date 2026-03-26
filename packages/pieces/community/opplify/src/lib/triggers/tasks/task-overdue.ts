import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const taskOverdue = createOpplifyTrigger({
  name: 'task_overdue',
  displayName: 'Task Overdue',
  description:
    'Triggers when a task passes its due date without being completed.',
  eventType: 'task_overdue',
  props: {},
  sampleData: SAMPLE_DATA.task_overdue,
});
