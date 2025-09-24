import { capsuleCrmCreateTrigger } from '../common/trigger';

export const newOpportunityTrigger = capsuleCrmCreateTrigger({
  name: 'new_opportunity',
  displayName: 'New Opportunity',
  description: 'Fires when a new opportunity is created.',
  event: 'opportunity/created',
  sampleData: {
    event: 'opportunity/created',
    payload: [
      {
        id: 83948362,
        updatedAt: '2015-10-29T12:55:12Z',
        description: 'Scope and design web site shopping cart',
        owner: {
          id: 6,
          username: 'scottspacey',
          name: 'Scott Spacey',
        },
        party: {
          id: 581,
          pictureURL:
            'https://capsulecrm.com/theme/default/images/person_avatar_70.png',
          type: 'organisation',
          name: 'Capsule',
        },
        lostReason: null,
        milestone: {
          id: 14,
          name: 'Bid',
        },
        value: {
          amount: 500,
          currency: 'GBP',
        },
        expectedCloseOn: '2015-10-31',
        probability: 50,
        durationBasis: 'FIXED',
        duration: null,
        closedOn: null,
        createdAt: '2015-10-29T12:55:12Z',
        name: 'Consulting',
      },
    ],
  },
});
