import { createSubscriptionTrigger } from '../common/subscription-trigger';

export const newTeamMessage = createSubscriptionTrigger<{
  id?: string | number;
  eventType?: string;
}>({
  name: 'new_team_message',
  displayName: 'New Team Messaging Post',
  description: 'Triggers when a new post is added in RingCentral Team Messaging.',
  eventFilters: ['/restapi/v1.0/glip/posts'],
  // The posts filter also fires for edits and removals; only additions are this trigger.
  accept: (post) => post.eventType === 'PostAdded',
  sampleData: {
    id: '5544332211',
    groupId: '112233445566',
    type: 'TextMessage',
    text: 'Hey team, the deploy is done!',
    creatorId: '778899',
    addedPersonIds: ['778899'],
    creationTime: '2024-01-15T20:10:00.000Z',
    lastModifiedTime: '2024-01-15T20:10:00.000Z',
    eventType: 'PostAdded',
  },
});
