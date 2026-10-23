import { askAmazonRufusAction } from './ask-amazon-rufus';
import { batchScrapeUrlsAction } from './batch-scrape-urls';
import { cancelBatchScrapeAction } from './cancel-batch-scrape';
import { cancelCrawlAction } from './cancel-crawl';
import { clearBrowserSignalsAction } from './clear-browser-signals';
import { createBrowserProfileAction } from './create-browser-profile';
import { createBrowserSessionAction } from './create-browser-session';
import { deleteBrowserExtensionAction } from './delete-browser-extension';
import { deleteBrowserProfileAction } from './delete-browser-profile';
import { getAccountInfoAction } from './get-account-info';
import { getAmazonProductAction } from './get-amazon-product';
import { getAmazonSellerAction } from './get-amazon-seller';
import { getBatchScrapeErrorsAction } from './get-batch-scrape-errors';
import { getBatchScrapeStatusAction } from './get-batch-scrape-status';
import { getBrowserExtensionAction } from './get-browser-extension';
import { getBrowserProfileAction } from './get-browser-profile';
import { getBrowserSessionLiveUrlAction } from './get-browser-session-live-url';
import { getBrowserSignalStatsAction } from './get-browser-signal-stats';
import { getCrawlErrorsAction } from './get-crawl-errors';
import { getCrawlStatusAction } from './get-crawl-status';
import { getGoogleTrendsAction } from './get-google-trends';
import { getScrapeStatusAction } from './get-scrape-status';
import { getScraperResultAction } from './get-scraper-result';
import { getShopeeProductAction } from './get-shopee-product';
import { getTiktokShopProductAction } from './get-tiktok-shop-product';
import { getTiktokUserAction } from './get-tiktok-user';
import { listBrowserExtensionsAction } from './list-browser-extensions';
import { listBrowserProfilesAction } from './list-browser-profiles';
import { listBrowserSignalsAction } from './list-browser-signals';
import { listRunningBrowserSessionsAction } from './list-running-browser-sessions';
import { listShopeeShopItemsAction } from './list-shopee-shop-items';
import { listTiktokUserVideosAction } from './list-tiktok-user-videos';
import { renameBrowserProfileAction } from './rename-browser-profile';
import { runScraperAction } from './run-scraper';
import { scrapeUrlAction } from './scrape-url';
import { searchAmazonProductsAction } from './search-amazon-products';
import { searchGoogleAction } from './search-google';
import { searchGoogleFlightsAction } from './search-google-flights';
import { searchGoogleImagesAction } from './search-google-images';
import { searchGoogleLocalAction } from './search-google-local';
import { searchGoogleScholarAction } from './search-google-scholar';
import { searchGoogleShoppingAction } from './search-google-shopping';
import { searchGoogleVideosAction } from './search-google-videos';
import { searchShopeeProductsAction } from './search-shopee-products';
import { sendBrowserSignalAction } from './send-browser-signal';
import { startCrawlAction } from './start-crawl';
import { unlockWebpageAction } from './unlock-webpage';
import { updateBrowserExtensionAction } from './update-browser-extension';
import { uploadBrowserExtensionAction } from './upload-browser-extension';
import { waitForBrowserSignalAction } from './wait-for-browser-signal';

export const scrapelessAiActions = [
  getAccountInfoAction,
  searchGoogleAction,
  searchGoogleImagesAction,
  searchGoogleLocalAction,
  searchGoogleVideosAction,
  searchGoogleShoppingAction,
  getGoogleTrendsAction,
  searchGoogleFlightsAction,
  searchGoogleScholarAction,
  getAmazonProductAction,
  getAmazonSellerAction,
  searchAmazonProductsAction,
  askAmazonRufusAction,
  getShopeeProductAction,
  searchShopeeProductsAction,
  listShopeeShopItemsAction,
  getTiktokUserAction,
  listTiktokUserVideosAction,
  getTiktokShopProductAction,
  runScraperAction,
  getScraperResultAction,
  unlockWebpageAction,
  scrapeUrlAction,
  batchScrapeUrlsAction,
  getScrapeStatusAction,
  getBatchScrapeStatusAction,
  cancelBatchScrapeAction,
  getBatchScrapeErrorsAction,
  startCrawlAction,
  getCrawlStatusAction,
  cancelCrawlAction,
  getCrawlErrorsAction,
  createBrowserSessionAction,
  listRunningBrowserSessionsAction,
  getBrowserSessionLiveUrlAction,
  sendBrowserSignalAction,
  waitForBrowserSignalAction,
  listBrowserSignalsAction,
  getBrowserSignalStatsAction,
  clearBrowserSignalsAction,
  createBrowserProfileAction,
  renameBrowserProfileAction,
  deleteBrowserProfileAction,
  getBrowserProfileAction,
  listBrowserProfilesAction,
  uploadBrowserExtensionAction,
  updateBrowserExtensionAction,
  deleteBrowserExtensionAction,
  getBrowserExtensionAction,
  listBrowserExtensionsAction,
];
