import { extractAction } from './extract';
import { listExtractDomainsAction } from './list-extract-domains';
import { requestExtractDomainAction } from './request-extract-domain';
import { getExtractDomainStatusAction } from './get-extract-domain-status';
import { createBatchJobAction } from './create-batch-job';
import { getBatchJobAction } from './get-batch-job';
import { cancelBatchJobAction } from './cancel-batch-job';
import { getBatchResultsAction } from './get-batch-results';
import { getBatchTaskContentAction } from './get-batch-task-content';
import { startCrawlAction } from './start-crawl';
import { getCrawlAction } from './get-crawl';
import { downloadCrawlAction } from './download-crawl';
import { getCrawlContentAction } from './get-crawl-content';
import { stopCrawlAction } from './stop-crawl';

export const generatedActions = [extractAction, listExtractDomainsAction, requestExtractDomainAction, getExtractDomainStatusAction, createBatchJobAction, getBatchJobAction, cancelBatchJobAction, getBatchResultsAction, getBatchTaskContentAction, startCrawlAction, getCrawlAction, downloadCrawlAction, getCrawlContentAction, stopCrawlAction];
