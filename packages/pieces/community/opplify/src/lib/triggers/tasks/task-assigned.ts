import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const taskAssigned = createOpplifyTrigger({
  name: 'task_assigned',
  displayName: 'Task Assigned',
  description:
    'Triggers when a task is assigned to a team member.',
  eventType: 'task_assigned',
  props: {},
  sampleData: SAMPLE_DATA.task_assigned,
});
