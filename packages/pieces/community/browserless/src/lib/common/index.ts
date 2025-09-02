import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import * as properties from './properties';
import * as schemas from './schemas';
import {
    captureScreenshotParams,
    generatePdfParams,
    getWebsitePerformanceParams,
    RunBqlQueryParams,
    ScrapeUrlParams,
} from './types';

export const browserlessAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
});

export const browserlessCommon = {
  baseUrl: 'https://production-sfo.browserless.io',
  endpoints: {
    captureScreenshot: '/chrome/screenshot',
    generatePdf: '/chrome/pdf',
    scrapeUrl: '/chrome/scrape',
    runBqlQuery: '/chromium/bql',
    getWebsitePerformance: '/chrome/performance',
  },
  // Properties
  captureScreenshotProperties: properties.captureScreenshot,
  generatePdfProperties: properties.generatePdf,
  scrapeUrlProperties: properties.scrapeUrl,
  runBqlQueryProperties: properties.runBqlQuery,
  getWebsitePerformanceProperties: properties.getWebsitePerformance,
  // Schemas
  captureScreenshotSchema: schemas.captureScreenshot,
  generatePdfSchema: schemas.generatePdf,
  // Methods
  captureScreenshot: async ({
    token,
    queryParams,
    body,
  }: captureScreenshotParams) => {
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${browserlessCommon.baseUrl}${browserlessCommon.endpoints.captureScreenshot}`,
      queryParams: {
        token,
        ...parseQueryParams(queryParams),
      },
      body,
    });
  },
  generatePdf: async ({ token, queryParams, body }: generatePdfParams) => {
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${browserlessCommon.baseUrl}${browserlessCommon.endpoints.generatePdf}`,
      queryParams: { token, ...parseQueryParams(queryParams) },
      body,
    });
  },
  scrapeUrl: async ({ token, queryParams, body }: ScrapeUrlParams) => {
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${browserlessCommon.baseUrl}${browserlessCommon.endpoints.scrapeUrl}`,
      queryParams: { token, ...parseQueryParams(queryParams) },
      body,
    });
  },
  runBqlQuery: async ({ token, query }: RunBqlQueryParams) => {
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${browserlessCommon.baseUrl}${browserlessCommon.endpoints.runBqlQuery}`,
      queryParams: { token },
      body: { query },
    });
  },
  getWebsitePerformance: async ({
    token,
    queryParams,
    body,
  }: getWebsitePerformanceParams) => {
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${browserlessCommon.baseUrl}${browserlessCommon.endpoints.getWebsitePerformance}`,
      queryParams: { token, ...parseQueryParams(queryParams) },
      body,
    });
  },
};

const parseQueryParams = (queryParams?: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(queryParams ?? {}).map(([key, value]) => [
      key,
      value !== undefined ? String(value) : value,
    ])
  );
};
