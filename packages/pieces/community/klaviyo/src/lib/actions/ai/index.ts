import { getProfileAi } from './get-profile';
import { listProfilesAi } from './list-profiles';
import { subscribeProfileAi } from './subscribe-profile';
import { unsubscribeProfileAi } from './unsubscribe-profile';
import { listListsAi } from './list-lists';
import { getListAi } from './get-list';
import { listListMembersAi } from './list-list-members';
import { listSegmentsAi } from './list-segments';
import { listSegmentMembersAi } from './list-segment-members';
import { listMetricsAi } from './list-metrics';
import { listEventsAi } from './list-events';

export const klaviyoAiActions = [
  getProfileAi,
  listProfilesAi,
  subscribeProfileAi,
  unsubscribeProfileAi,
  listListsAi,
  getListAi,
  listListMembersAi,
  listSegmentsAi,
  listSegmentMembersAi,
  listMetricsAi,
  listEventsAi,
];
