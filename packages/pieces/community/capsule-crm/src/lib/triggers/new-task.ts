import { capsuleCrmCreateTrigger } from '../common/trigger';

export const newTaskTrigger = capsuleCrmCreateTrigger({
  name: 'new_task',
  displayName: 'New Task',
  description: 'Fires when a new task is created.',
  event: 'task/created',
  sampleData: {
    event: 'task/created',
    payload: [
      {
        id: 530,
        description: 'Email product details',
        dueTime: '18:00:00',
        status: 'OPEN',
        party: {
          id: 11587,
          type: 'person',
          firstName: 'Scott',
          lastName: 'Spacey',
          pictureURL:
            'https://capsulecrm.com/theme/default/images/person_avatar_70.png',
        },
        owner: {
          id: 1,
          username: 'john',
          name: 'John Spacey',
        },
        createdAt: '2015-12-21T13:51:38Z',
        updatedAt: '2015-12-21T13:51:38Z',
        dueOn: '2014-05-20',
        hasTrack: false,
      },
    ],
  },
});
