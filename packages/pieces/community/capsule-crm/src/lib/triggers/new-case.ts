import { capsuleCrmCreateTrigger } from '../common/trigger';

export const newCaseTrigger = capsuleCrmCreateTrigger({
  name: 'new_case',
  displayName: 'New Case',
  description: 'Fires when a new case (project) is created in Capsule CRM.',
  event: 'kase/created',
  sampleData: {
    event: 'kase/created',
    payload: [
      {
        id: 12,
        party: {
          id: 892,
          type: 'organisation',
          name: 'Zestia',
          pictureURL:
            'https://capsulecrm.com/theme/default/images/org_avatar_70.png',
        },
        owner: {
          id: 61,
          username: 'ted',
          name: 'Ted Danson',
        },
        status: 'OPEN',
        stage: {
          name: 'Project Brief',
          id: 149,
        },
        createdAt: '2015-12-07T16:54:27Z',
        updatedAt: '2015-12-07T16:54:27Z',
        expectedCloseOn: '2015-12-09',
        description: 'Scope and design web site shopping cart',
        name: 'Consulting',
      },
    ],
  },
});
