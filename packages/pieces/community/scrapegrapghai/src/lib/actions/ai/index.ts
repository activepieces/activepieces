import { createMonitorAction } from './create-monitor';
import { deleteCrawlAction } from './delete-crawl';
import { deleteMonitorAction } from './delete-monitor';
import { extractDataAction } from './extract-data';
import { getCrawlAction } from './get-crawl';
import { getCreditsAction } from './get-credits';
import { getHistoryEntryAction } from './get-history-entry';
import { getMonitorAction } from './get-monitor';
import { listCrawlPagesAction } from './list-crawl-pages';
import { listHistoryAction } from './list-history';
import { listMonitorActivityAction } from './list-monitor-activity';
import { listMonitorsAction } from './list-monitors';
import { pauseMonitorAction } from './pause-monitor';
import { resumeCrawlAction } from './resume-crawl';
import { resumeMonitorAction } from './resume-monitor';
import { scrapePageAction } from './scrape-page';
import { searchWebAction } from './search-web';
import { startCrawlAction } from './start-crawl';
import { stopCrawlAction } from './stop-crawl';
import { updateMonitorAction } from './update-monitor';

export const scrapegraphaiAiActions = [
	scrapePageAction,
	extractDataAction,
	searchWebAction,
	startCrawlAction,
	getCrawlAction,
	listCrawlPagesAction,
	stopCrawlAction,
	resumeCrawlAction,
	deleteCrawlAction,
	createMonitorAction,
	listMonitorsAction,
	getMonitorAction,
	updateMonitorAction,
	pauseMonitorAction,
	resumeMonitorAction,
	deleteMonitorAction,
	listMonitorActivityAction,
	listHistoryAction,
	getHistoryEntryAction,
	getCreditsAction,
];
