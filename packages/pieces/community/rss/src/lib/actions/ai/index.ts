import { rssFindSiteFeedsAction } from './find-site-feeds';
import { rssReadFeedAction } from './read-feed';
import { rssReadMultipleFeedsAction } from './read-multiple-feeds';

export const rssAiActions = [rssReadFeedAction, rssReadMultipleFeedsAction, rssFindSiteFeedsAction];
