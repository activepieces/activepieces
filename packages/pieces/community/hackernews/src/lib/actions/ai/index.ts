import { getItemAction } from './get-item';
import { getMaxItemIdAction } from './get-max-item-id';
import { getUpdatesAction } from './get-updates';
import { getUserAction } from './get-user';
import { listAskStoriesAction } from './list-ask-stories';
import { listBestStoriesAction } from './list-best-stories';
import { listJobStoriesAction } from './list-job-stories';
import { listNewStoriesAction } from './list-new-stories';
import { listShowStoriesAction } from './list-show-stories';
import { listTopStoriesAction } from './list-top-stories';

export const hackernewsAiActions = [
	listTopStoriesAction,
	listNewStoriesAction,
	listBestStoriesAction,
	listAskStoriesAction,
	listShowStoriesAction,
	listJobStoriesAction,
	getItemAction,
	getMaxItemIdAction,
	getUpdatesAction,
	getUserAction,
];
