import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const taskCreated = createOpplifyTrigger({
  name: 'task_created',
  displayName: 'Task Created',
  description:
    'Triggers when a new task is created for a lead.',
  eventType: 'task_created',
  props: {},
  sampleData: SAMPLE_DATA.task_created,
});
