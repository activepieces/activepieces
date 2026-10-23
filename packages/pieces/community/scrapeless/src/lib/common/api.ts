import FormData from 'form-data';

import { HttpMethod } from '@activepieces/pieces-common';

import { scrapelessClient } from './client';

import type {
  ScrapelessAccount,
  ScrapelessAuthValue,
  ScrapelessBrowserOptions,
  ScrapelessScrapeOptions,
  ScrapelessScraperInput,
  ScrapelessScraperTask,
} from './types';

async function getMe({
  auth,
}: {
  auth: ScrapelessAuthValue;
}): Promise<ScrapelessAccount> {
  return await scrapelessClient.request<ScrapelessAccount>({
    auth,
    method: HttpMethod.GET,
    path: '/api/v1/me',
  });
}

async function runScraper({
  auth,
  actor,
  input,
  proxyCountry,
  runAsync = false,
}: RunScraperParams & {
  auth: ScrapelessAuthValue;
}): Promise<ScrapelessScraperTask> {
  const response = await scrapelessClient.send<ScraperBody>({
    auth,
    method: HttpMethod.POST,
    path: '/api/v1/scraper/request',
    body: {
      actor,
      input: withoutUndefined({ input }),
      ...(proxyCountry ? { proxy: { country: proxyCountry } } : {}),
      async: runAsync,
    },
  });
  return toTask({ status: response.status, body: response.body });
}

async function getScraperResult({
  auth,
  taskId,
}: {
  auth: ScrapelessAuthValue;
  taskId: string;
}): Promise<ScrapelessScraperTask> {
  const response = await scrapelessClient.send<ScraperBody>({
    auth,
    method: HttpMethod.GET,
    path: `/api/v1/scraper/result/${encodeURIComponent(taskId)}`,
  });
  return toTask({ status: response.status, body: response.body, taskId });
}

async function unlockWebpage({
  auth,
  input,
  proxyCountry,
}: {
  auth: ScrapelessAuthValue;
  input: ScrapelessScraperInput;
  proxyCountry: string;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/api/v2/unlocker/request',
    body: {
      actor: 'unlocker.webunlocker',
      input: withoutUndefined({ input }),
      proxy: { country: proxyCountry },
    },
  });
}

async function startScrape({
  auth,
  url,
  options,
  browserOptions,
}: {
  auth: ScrapelessAuthValue;
  url: string;
  options: ScrapelessScrapeOptions;
  browserOptions: ScrapelessBrowserOptions;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/api/v2/crawler/scrape',
    body: {
      url,
      ...withoutUndefined({ input: options }),
      ...browserOptionsBody({ browserOptions }),
    },
  });
}

async function startBatchScrape({
  auth,
  urls,
  options,
  browserOptions,
}: {
  auth: ScrapelessAuthValue;
  urls: string[];
  options: ScrapelessScrapeOptions;
  browserOptions: ScrapelessBrowserOptions;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/api/v2/crawler/scrape/batch',
    body: {
      urls,
      ...withoutUndefined({ input: options }),
      ...browserOptionsBody({ browserOptions }),
    },
  });
}

async function startCrawl({
  auth,
  url,
  crawl,
  options,
  browserOptions,
}: {
  auth: ScrapelessAuthValue;
  url: string;
  crawl: ScrapelessScraperInput;
  options: ScrapelessScrapeOptions;
  browserOptions: ScrapelessBrowserOptions;
}): Promise<unknown> {
  const scrapeOptions = withoutUndefined({ input: options });
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/api/v2/crawler/crawl',
    body: {
      url,
      ...withoutUndefined({ input: crawl }),
      ...(Object.keys(scrapeOptions).length > 0 ? { scrapeOptions } : {}),
      ...browserOptionsBody({ browserOptions }),
    },
  });
}

async function crawlerJob({
  auth,
  method,
  path,
}: {
  auth: ScrapelessAuthValue;
  method: HttpMethod;
  path: string;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({ auth, method, path });
}

async function getScrape({ auth, id }: JobParams): Promise<unknown> {
  return await crawlerJob({
    auth,
    method: HttpMethod.GET,
    path: `/api/v1/crawler/scrape/${encodeURIComponent(id)}`,
  });
}

async function getBatchScrape({ auth, id }: JobParams): Promise<unknown> {
  return await crawlerJob({
    auth,
    method: HttpMethod.GET,
    path: `/api/v1/crawler/scrape/batch/${encodeURIComponent(id)}`,
  });
}

async function cancelBatchScrape({ auth, id }: JobParams): Promise<unknown> {
  return await crawlerJob({
    auth,
    method: HttpMethod.DELETE,
    path: `/api/v1/crawler/scrape/batch/${encodeURIComponent(id)}`,
  });
}

async function getBatchScrapeErrors({ auth, id }: JobParams): Promise<unknown> {
  return await crawlerJob({
    auth,
    method: HttpMethod.GET,
    path: `/api/v1/crawler/scrape/batch/${encodeURIComponent(id)}/errors`,
  });
}

async function getCrawl({ auth, id }: JobParams): Promise<unknown> {
  return await crawlerJob({
    auth,
    method: HttpMethod.GET,
    path: `/api/v1/crawler/crawl/${encodeURIComponent(id)}`,
  });
}

async function cancelCrawl({ auth, id }: JobParams): Promise<unknown> {
  return await crawlerJob({
    auth,
    method: HttpMethod.DELETE,
    path: `/api/v1/crawler/crawl/${encodeURIComponent(id)}`,
  });
}

async function getCrawlErrors({ auth, id }: JobParams): Promise<unknown> {
  return await crawlerJob({
    auth,
    method: HttpMethod.GET,
    path: `/api/v1/crawler/crawl/${encodeURIComponent(id)}/errors`,
  });
}

async function createBrowserSession({
  auth,
  options,
}: {
  auth: ScrapelessAuthValue;
  options: Record<string, string | undefined>;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/api/v2/browser',
    query: {
      token: auth.secret_text,
      ...Object.fromEntries(
        Object.entries(options).filter(
          (entry): entry is [string, string] => entry[1] !== undefined
        )
      ),
    },
  });
}

async function listRunningBrowserSessions({
  auth,
}: {
  auth: ScrapelessAuthValue;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/browser/running',
  });
}

async function getBrowserSessionLiveUrl({
  auth,
  taskId,
}: SessionParams): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/browser/${encodeURIComponent(taskId)}/live`,
  });
}

async function sendBrowserSignal({
  auth,
  taskId,
  event,
  data,
}: SessionParams & {
  event: string;
  data?: Record<string, unknown>;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/browser/${encodeURIComponent(taskId)}/signal/send`,
    body: { event, ...(data !== undefined ? { data } : {}) },
  });
}

async function waitForBrowserSignal({
  auth,
  taskId,
  event,
  timeout,
}: SessionParams & { event: string; timeout?: number }): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/browser/${encodeURIComponent(taskId)}/signal/wait`,
    query: {
      event,
      ...(timeout !== undefined ? { timeout: String(timeout) } : {}),
    },
  });
}

async function listBrowserSignals({
  auth,
  taskId,
}: SessionParams): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/browser/${encodeURIComponent(taskId)}/signal/list`,
  });
}

async function getBrowserSignalStats({
  auth,
  taskId,
}: SessionParams): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/browser/${encodeURIComponent(taskId)}/signal/stats`,
  });
}

async function clearBrowserSignals({
  auth,
  taskId,
  event,
}: SessionParams & { event?: string }): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `/browser/${encodeURIComponent(taskId)}/signal/clear`,
    body: event !== undefined ? { event } : {},
  });
}

async function createBrowserProfile({
  auth,
  name,
}: {
  auth: ScrapelessAuthValue;
  name: string;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/browser/profiles',
    body: { name },
  });
}

async function renameBrowserProfile({
  auth,
  profileId,
  name,
}: ProfileParams & { name: string }): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `/browser/profiles/${encodeURIComponent(profileId)}`,
    body: { name },
  });
}

async function deleteBrowserProfile({
  auth,
  profileId,
}: ProfileParams): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `/browser/profiles/${encodeURIComponent(profileId)}`,
  });
}

async function getBrowserProfile({
  auth,
  profileId,
}: ProfileParams): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/browser/profiles/${encodeURIComponent(profileId)}`,
  });
}

async function listBrowserProfiles({
  auth,
  page,
  pageSize,
  name,
}: {
  auth: ScrapelessAuthValue;
  page: number;
  pageSize: number;
  name?: string;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/browser/profiles',
    query: {
      page: String(page),
      pageSize: String(pageSize),
      ...(name ? { name } : {}),
    },
  });
}

async function uploadBrowserExtension({
  auth,
  name,
  file,
}: ExtensionFileParams): Promise<unknown> {
  const form = extensionForm({ name, file });
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/browser/extensions/upload',
    body: form,
    headers: form.getHeaders(),
  });
}

async function updateBrowserExtension({
  auth,
  extensionId,
  name,
  file,
}: ExtensionFileParams & { extensionId: string }): Promise<unknown> {
  const form = extensionForm({ name, file });
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `/browser/extensions/${encodeURIComponent(extensionId)}`,
    body: form,
    headers: form.getHeaders(),
  });
}

async function deleteBrowserExtension({
  auth,
  extensionId,
}: ExtensionParams): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `/browser/extensions/${encodeURIComponent(extensionId)}`,
  });
}

async function getBrowserExtension({
  auth,
  extensionId,
}: ExtensionParams): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/browser/extensions/${encodeURIComponent(extensionId)}`,
  });
}

async function listBrowserExtensions({
  auth,
}: {
  auth: ScrapelessAuthValue;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/browser/extensions/list',
  });
}

function extensionForm({
  name,
  file,
}: {
  name: string;
  file: { filename: string; data: Buffer };
}): FormData {
  const form = new FormData();
  form.append('name', name);
  form.append('file', file.data, { filename: file.filename });
  return form;
}

function browserOptionsBody({
  browserOptions,
}: {
  browserOptions: ScrapelessBrowserOptions;
}): { browserOptions?: ScrapelessBrowserOptions } {
  return browserOptions.proxy_country ? { browserOptions } : {};
}

function toTask({
  status,
  body,
  taskId,
}: {
  status: number;
  body: ScraperBody;
  taskId?: string;
}): ScrapelessScraperTask {
  if (status === 200) {
    return { completed: true, taskId: taskId ?? null, data: body };
  }
  return {
    completed: false,
    taskId: body?.taskId ?? taskId ?? null,
    data: null,
  };
}

function withoutUndefined({
  input,
}: {
  input: ScrapelessScraperInput;
}): ScrapelessScraperInput {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  );
}

export const scrapelessApi = {
  getMe,
  runScraper,
  getScraperResult,
  unlockWebpage,
  startScrape,
  startBatchScrape,
  startCrawl,
  getScrape,
  getBatchScrape,
  cancelBatchScrape,
  getBatchScrapeErrors,
  getCrawl,
  cancelCrawl,
  getCrawlErrors,
  createBrowserSession,
  listRunningBrowserSessions,
  getBrowserSessionLiveUrl,
  sendBrowserSignal,
  waitForBrowserSignal,
  listBrowserSignals,
  getBrowserSignalStats,
  clearBrowserSignals,
  createBrowserProfile,
  renameBrowserProfile,
  deleteBrowserProfile,
  getBrowserProfile,
  listBrowserProfiles,
  uploadBrowserExtension,
  updateBrowserExtension,
  deleteBrowserExtension,
  getBrowserExtension,
  listBrowserExtensions,
};

type ScraperBody = { taskId?: string } | null;

type RunScraperParams = {
  actor: string;
  input: ScrapelessScraperInput;
  proxyCountry?: string;
  runAsync?: boolean;
};

type JobParams = { auth: ScrapelessAuthValue; id: string };

type SessionParams = { auth: ScrapelessAuthValue; taskId: string };

type ProfileParams = { auth: ScrapelessAuthValue; profileId: string };

type ExtensionParams = { auth: ScrapelessAuthValue; extensionId: string };

type ExtensionFileParams = {
  auth: ScrapelessAuthValue;
  name: string;
  file: { filename: string; data: Buffer };
};
