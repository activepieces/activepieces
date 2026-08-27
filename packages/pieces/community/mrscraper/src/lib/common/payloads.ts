import structuredDataPrompts from './structured-data-prompts.json';
import { mrscraperValidation } from './validation';

const MODES: readonly ['Super', 'Cheap'] = ['Super', 'Cheap'];
const FORMATS: readonly ['json', 'html'] = ['json', 'html'];
const CATEGORIES: readonly ['article', 'forumThread', 'hotel', 'jobPosting', 'post', 'product', 'property', 'restaurant', 'socialMediaProfile', 'tourAttraction'] = ['article', 'forumThread', 'hotel', 'jobPosting', 'post', 'product', 'property', 'restaurant', 'socialMediaProfile', 'tourAttraction'];
const SCRAPER_TYPES: readonly ['ai', 'manual'] = ['ai', 'manual'];
const AGENT_TYPES: readonly ['general', 'listing', 'map'] = ['general', 'listing', 'map'];
const WAIT_UNTIL_VALUES: readonly ['domcontentloaded', 'load', 'networkidle'] = ['domcontentloaded', 'load', 'networkidle'];
const SCREENSHOT_MODES: readonly ['full', 'top'] = ['full', 'top'];

function mapPayload(props: MapProps): Record<string, unknown> {
  return {
    graph: 'map',
    url: mrscraperValidation.url({ value: props.url, field: 'URL' }),
    maxDepth: mrscraperValidation.integer({ value: props.max_depth, field: 'Max Depth', defaultValue: 2 }),
    maxPages: mrscraperValidation.integer({ value: props.max_pages, field: 'Max Pages', defaultValue: 50 }),
    limit: mrscraperValidation.integer({ value: props.limit, field: 'Limit', defaultValue: 50, minimum: 1 }),
    ...optionalField('includePatterns', mrscraperValidation.optionalText({ value: props.include_patterns, field: 'Include Patterns' })),
    ...optionalField('excludePatterns', mrscraperValidation.optionalText({ value: props.exclude_patterns, field: 'Exclude Patterns' })),
  };
}

function generalPayload(props: GeneralProps): Record<string, unknown> {
  const message = appendSchema({
    prompt: props.prompt,
    schema: props.output_schema,
    label: 'Return the output as JSON matching this schema:',
  });
  return {
    graph: 'general',
    url: mrscraperValidation.url({ value: props.url, field: 'URL' }),
    ...optionalField('message', message),
    mode: mrscraperValidation.oneOf({ value: props.mode, field: 'Mode', values: MODES, defaultValue: 'Super' }),
    ...optionalField('proxyCountry', mrscraperValidation.code({ value: props.proxy_country, field: 'Proxy Country' })),
  };
}

function listingPayload(props: ListingProps): Record<string, unknown> {
  const message = appendSchema({
    prompt: props.prompt,
    schema: props.output_schema,
    label: 'Return each item as JSON matching this schema:',
  });
  return {
    graph: 'listing',
    url: mrscraperValidation.url({ value: props.url, field: 'URL' }),
    ...optionalField('message', message),
    maxPages: mrscraperValidation.integer({ value: props.max_pages, field: 'Max Pages', defaultValue: 1, minimum: 1 }),
    ...optionalField('proxyCountry', mrscraperValidation.code({ value: props.proxy_country, field: 'Proxy Country' })),
  };
}

function structuredPayload(props: StructuredProps): Record<string, unknown> {
  const category = mrscraperValidation.oneOf({ value: props.category, field: 'Category', values: CATEGORIES, defaultValue: 'article' });
  return {
    graph: 'general',
    url: mrscraperValidation.url({ value: props.url, field: 'URL' }),
    message: structuredDataPrompts[category],
    mode: mrscraperValidation.oneOf({ value: props.mode, field: 'Mode', values: MODES, defaultValue: 'Super' }),
    ...optionalField('proxyCountry', mrscraperValidation.code({ value: props.proxy_country, field: 'Proxy Country' })),
  };
}

function serpPayload(props: SerpProps): SerpResult {
  const format = mrscraperValidation.oneOf({ value: props.format, field: 'Format', values: FORMATS, defaultValue: 'json' });
  return {
    format,
    body: {
      query: mrscraperValidation.requiredText({ value: props.query, field: 'Search Query' }),
      region: mrscraperValidation.code({ value: props.region, field: 'Region', defaultValue: 'us' }),
      language: mrscraperValidation.code({ value: props.language, field: 'Language', defaultValue: 'en' }),
      page: mrscraperValidation.integer({ value: props.page, field: 'Page', defaultValue: 1, minimum: 1 }),
      format,
      renderJs: props.render_js ?? false,
    },
  };
}

function renderedRequest(props: RenderedProps): RenderedResult {
  const timeout = mrscraperValidation.integer({ value: props.timeout, field: 'Timeout', defaultValue: 300, minimum: 1 });
  return {
    timeout: (timeout + 30) * 1_000,
    queryParams: {
      timeout: String(timeout),
      geoCode: mrscraperValidation.code({ value: props.geo_code, field: 'Geo Code', defaultValue: 'us' }) ?? 'us',
      ...(props.html === true ? { html: 'true' } : {}),
      ...(props.markdown === true ? { markdown: 'true' } : {}),
      ...(props.screenshot === true ? { screenshot: mrscraperValidation.oneOf({ value: props.screenshot_mode, field: 'Screenshot Mode', values: SCREENSHOT_MODES, defaultValue: 'full' }) } : {}),
      proxyCountry: mrscraperValidation.code({ value: props.proxy_country, field: 'Proxy Country', defaultValue: 'us' }) ?? 'us',
      ...optionalField('waitForSelector', mrscraperValidation.optionalText({ value: props.wait_for_selector, field: 'Wait for Selector' })),
      ...(props.wait_until === undefined ? {} : { waitUntil: mrscraperValidation.oneOf({ value: props.wait_until, field: 'Wait Until', values: WAIT_UNTIL_VALUES, defaultValue: 'domcontentloaded' }) }),
      ...(props.block_resources === true ? { blockResources: 'true' } : {}),
      ...(props.return_cookie === true ? { returnCookie: 'true' } : {}),
      ...(props.super_mode === true ? { super: 'true' } : {}),
    },
    body: {
      url: mrscraperValidation.url({ value: props.url, field: 'URL' }),
      maxRetries: mrscraperValidation.integer({ value: props.max_retries, field: 'Max Retries', defaultValue: 3, minimum: 0 }),
      ...(props.token_cap === undefined ? {} : { tokenCap: mrscraperValidation.integer({ value: props.token_cap, field: 'Token Cap', defaultValue: 30, minimum: 1 }) }),
      ...(props.home_page === true ? { homePage: true } : {}),
    },
  };
}

function resultsQuery(props: ResultsProps): Record<string, string> {
  return {
    'filters[scraperId]': mrscraperValidation.requiredText({ value: props.scraper_id, field: 'Scraper ID' }),
    page: String(mrscraperValidation.integer({ value: props.page, field: 'Page', defaultValue: 1 })),
    pageSize: String(mrscraperValidation.integer({ value: props.page_size, field: 'Page Size', defaultValue: 10 })),
    sort: mrscraperValidation.oneOf({ value: props.sort_by, field: 'Sort By', values: ['createdAt'], defaultValue: 'createdAt' }),
    sortOrder: mrscraperValidation.oneOf({ value: props.sort_order, field: 'Sort Order', values: ['ASC', 'DESC'], defaultValue: 'DESC' }),
  };
}

function latestQuery(props: LatestProps): Record<string, string> {
  return {
    'filters[scraperId]': mrscraperValidation.requiredText({ value: props.scraper_id, field: 'Scraper ID' }),
    page: '1',
    pageSize: String(mrscraperValidation.integer({ value: props.count, field: 'Count', defaultValue: 10 })),
    sort: 'createdAt',
    sortOrder: 'DESC',
  };
}

function detailPath(resultId: unknown): string {
  const value = mrscraperValidation.requiredText({ value: resultId, field: 'Result ID' });
  return `/api/v1/results/${encodeURIComponent(value)}`;
}

function singleRun(props: RunProps): RunResult {
  const scraperType = mrscraperValidation.oneOf({ value: props.scraper_type, field: 'Scraper Type', values: SCRAPER_TYPES, defaultValue: 'ai' });
  const common = {
    scraperId: mrscraperValidation.requiredText({ value: props.scraper_id, field: 'Scraper ID' }),
    url: mrscraperValidation.url({ value: props.url, field: 'URL' }),
    maxRetry: mrscraperValidation.integer({ value: props.max_retry, field: 'Max Retry', defaultValue: 3, minimum: 0 }),
    ...optionalField('proxyCountry', mrscraperValidation.code({ value: props.proxy_country, field: 'Proxy Country' })),
  };
  if (scraperType === 'manual') {
    return { path: '/api/v1/scrapers-manual-rerun', body: { ...common, ...manualRunBody(props) } };
  }
  const agentType = mrscraperValidation.oneOf({ value: props.agent_type, field: 'Agent Type', values: AGENT_TYPES, defaultValue: 'general' });
  return { path: '/api/v1/scrapers-ai-rerun', body: { ...common, ...aiRunBody({ props, agentType }) } };
}

function batchRun(props: BatchProps): RunResult {
  const scraperType = mrscraperValidation.oneOf({ value: props.scraper_type, field: 'Scraper Type', values: SCRAPER_TYPES, defaultValue: 'ai' });
  return {
    path: scraperType === 'manual' ? '/api/v1/scrapers-manual-rerun/bulk' : '/api/v1/scrapers-ai-rerun/bulk',
    body: {
      scraperId: mrscraperValidation.requiredText({ value: props.scraper_id, field: 'Scraper ID' }),
      urls: mrscraperValidation.urls(props.urls),
    },
  };
}

function aiRunBody({ props, agentType }: AiRunParams): Record<string, unknown> {
  if (agentType === 'map') {
    return {
      ...(props.max_depth === undefined ? {} : { maxDepth: mrscraperValidation.integer({ value: props.max_depth, field: 'Max Depth', defaultValue: 2, minimum: 0 }) }),
      ...(props.max_pages === undefined ? {} : { maxPages: mrscraperValidation.integer({ value: props.max_pages, field: 'Max Pages', defaultValue: 50, minimum: 1 }) }),
      ...(props.limit === undefined ? {} : { limit: mrscraperValidation.integer({ value: props.limit, field: 'Limit', defaultValue: 50, minimum: 1 }) }),
      ...optionalField('includePatterns', mrscraperValidation.optionalText({ value: props.include_patterns, field: 'Include Patterns' })),
      ...optionalField('excludePatterns', mrscraperValidation.optionalText({ value: props.exclude_patterns, field: 'Exclude Patterns' })),
    };
  }
  return {
    ...(agentType === 'listing' && props.max_pages !== undefined ? { maxPages: mrscraperValidation.integer({ value: props.max_pages, field: 'Max Pages', defaultValue: 5, minimum: 1 }) } : {}),
    ...(agentType === 'listing' && props.timeout !== undefined ? { timeout: mrscraperValidation.integer({ value: props.timeout, field: 'Timeout', defaultValue: 300, minimum: 1 }) } : {}),
    ...(props.bypass_proxy === true ? { bypassProxy: true } : {}),
    ...(props.html === true ? { html: true } : {}),
    ...(props.markdown === true ? { markdown: true } : {}),
    ...(props.render_javascript === true ? { renderJavascript: true } : {}),
    ...(props.return_cookies === true ? { returnCookies: true } : {}),
    ...(props.screenshot === true ? { screenshot: true } : {}),
    ...(agentType === 'listing' && props.stream === true ? { stream: true } : {}),
    ...(props.use_home_page === true ? { useHomePage: true } : {}),
    ...optionalField('waitForSelector', mrscraperValidation.optionalText({ value: props.wait_for_selector, field: 'Wait for Selector' })),
  };
}

function manualRunBody(props: RunProps): Record<string, unknown> {
  return {
    ...(props.bypass_proxy === true ? { bypassProxy: true } : {}),
    ...optionalField('cookieJar', mrscraperValidation.optionalText({ value: props.cookie_jar, field: 'Cookie Jar' })),
    ...(props.cookies === undefined ? {} : { cookies: mrscraperValidation.records({ value: props.cookies, field: 'Cookies', defaultValue: [] }) }),
    ...(props.home_page === true ? { homePage: true } : {}),
    ...(props.home_page_timeout === undefined ? {} : { homePageTimeout: mrscraperValidation.integer({ value: props.home_page_timeout, field: 'Home Page Timeout', defaultValue: 10, minimum: 1 }) }),
    ...(props.html === true ? { html: true } : {}),
    ...(props.markdown === true ? { markdown: true } : {}),
    ...(props.paginator === undefined ? {} : { paginator: mrscraperValidation.record({ value: props.paginator, field: 'Paginator', defaultValue: {} }) }),
    ...optionalField('proxy', mrscraperValidation.optionalText({ value: props.proxy, field: 'Proxy' })),
    ...(props.record === true ? { record: true } : {}),
    ...(props.return_cookie === true ? { returnCookie: true } : {}),
    ...(props.screenshot === true ? { screenshot: 'true' } : {}),
    ...(props.stream === true ? { stream: true } : {}),
    ...(props.timeout === undefined ? {} : { timeout: mrscraperValidation.integer({ value: props.timeout, field: 'Timeout', defaultValue: 600, minimum: 1 }) }),
    ...(props.token_cap === undefined ? {} : { tokenCap: mrscraperValidation.integer({ value: props.token_cap, field: 'Token Cap', defaultValue: 0, minimum: 0 }) }),
  };
}

function appendSchema({ prompt, schema, label }: SchemaParams): string | undefined {
  const text = mrscraperValidation.optionalText({ value: prompt, field: 'Prompt' });
  if (schema === undefined) return text;
  const object = mrscraperValidation.record({ value: schema, field: 'Output Schema', defaultValue: {} });
  const block = `${label}\n${JSON.stringify(object)}`;
  if (text?.endsWith(block)) return text;
  return text === undefined ? block : `${text}\n\n${block}`;
}

function optionalField(key: string, value: unknown): Record<string, unknown> {
  return value === undefined ? {} : { [key]: value };
}

export const mrscraperPayloads = {
  appendSchema,
  batchRun,
  detailPath,
  general: generalPayload,
  latestQuery,
  listing: listingPayload,
  map: mapPayload,
  renderedRequest,
  resultsQuery,
  serp: serpPayload,
  singleRun,
  structured: structuredPayload,
  structuredDataPrompts,
};

type MapProps = { url: unknown; max_depth?: unknown; max_pages?: unknown; limit?: unknown; include_patterns?: unknown; exclude_patterns?: unknown };
type GeneralProps = { url: unknown; prompt?: unknown; output_schema?: unknown; mode?: unknown; proxy_country?: unknown };
type ListingProps = { url: unknown; prompt?: unknown; output_schema?: unknown; max_pages?: unknown; proxy_country?: unknown };
type StructuredProps = { url: unknown; category?: unknown; mode?: unknown; proxy_country?: unknown };
type SerpProps = { query: unknown; region?: unknown; language?: unknown; page?: unknown; format?: unknown; render_js?: boolean };
type RenderedProps = { url: unknown; max_retries?: unknown; timeout?: unknown; geo_code?: unknown; proxy_country?: unknown; screenshot?: boolean; screenshot_mode?: unknown; html?: boolean; markdown?: boolean; token_cap?: unknown; wait_for_selector?: unknown; wait_until?: unknown; block_resources?: boolean; home_page?: boolean; return_cookie?: boolean; super_mode?: boolean };
type ResultsProps = { scraper_id: unknown; page?: unknown; page_size?: unknown; sort_by?: unknown; sort_order?: unknown };
type LatestProps = { scraper_id: unknown; count?: unknown };
type BatchProps = { scraper_type: unknown; scraper_id: unknown; urls: unknown };
type RunProps = { scraper_type: unknown; scraper_id: unknown; url: unknown; max_retry?: unknown; proxy_country?: unknown; agent_type?: unknown; max_pages?: unknown; timeout?: unknown; bypass_proxy?: boolean; html?: boolean; markdown?: boolean; render_javascript?: boolean; return_cookies?: boolean; screenshot?: boolean; stream?: boolean; use_home_page?: boolean; wait_for_selector?: unknown; max_depth?: unknown; limit?: unknown; include_patterns?: unknown; exclude_patterns?: unknown; cookie_jar?: unknown; cookies?: unknown; home_page?: boolean; home_page_timeout?: unknown; paginator?: unknown; proxy?: unknown; record?: boolean; return_cookie?: boolean; token_cap?: unknown };
type AiRunParams = { props: RunProps; agentType: 'general' | 'listing' | 'map' };
type SchemaParams = { prompt: unknown; schema: unknown; label: string };
type SerpResult = { format: 'json' | 'html'; body: Record<string, unknown> };
type RenderedResult = { timeout: number; queryParams: Record<string, string>; body: Record<string, unknown> };
type RunResult = { path: string; body: Record<string, unknown> };
