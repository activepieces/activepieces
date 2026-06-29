/**
 * @fileoverview Type definitions for SerpApi integration
 * Provides comprehensive type safety and clear contracts for all SerpApi operations
 */

/**
 * Base configuration for all SerpApi requests
 */
export interface BaseSerpApiConfig {
  /** API key for authentication */
  api_key: string;
  /** Search engine to use */
  engine: SerpApiEngine;
  /** Search query */
  q?: string;
  /** Language code (e.g., 'en', 'es', 'fr') */
  hl?: string;
  /** Country code (e.g., 'us', 'uk', 'ca') */
  gl?: string;
  /** Number of results to return */
  num?: number;
  /** Starting position for pagination */
  start?: number;
}

/**
 * Supported SerpApi search engines
 */
export enum SerpApiEngine {
  GOOGLE = 'google',
  GOOGLE_NEWS = 'google_news',
  YOUTUBE = 'youtube',
  GOOGLE_TRENDS = 'google_trends',
  GOOGLE_MAPS = 'google_maps',
  GOOGLE_SCHOLAR = 'google_scholar',
  GOOGLE_IMAGES = 'google_images',
  GOOGLE_SHOPPING = 'google_shopping',
  GOOGLE_JOBS = 'google_jobs',
  GOOGLE_LENS = 'google_lens',
  GOOGLE_LOCAL_SERVICES = 'google_local_services',
  APPLE_APP_STORE = 'apple_app_store',
  GOOGLE_PLAY = 'google_play',
  YELP = 'yelp',
  WALMART = 'walmart',
  BING = 'bing',
  DUCKDUCKGO = 'duckduckgo',
}

/**
 * Time period filters for various search types
 */
export enum TimePeriod {
  PAST_HOUR = 'h',
  PAST_DAY = 'd',
  PAST_WEEK = 'w',
  PAST_MONTH = 'm',
  PAST_YEAR = 'y',
}

/**
 * Google Trends specific time periods
 */
export enum GoogleTrendsTimePeriod {
  PAST_HOUR = 'now 1-H',
  PAST_4_HOURS = 'now 4-H',
  PAST_DAY = 'now 1-d',
  PAST_7_DAYS = 'now 7-d',
  PAST_30_DAYS = 'today 1-m',
  PAST_90_DAYS = 'today 3-m',
  PAST_12_MONTHS = 'today 12-m',
  PAST_5_YEARS = 'today 5-y',
  ALL_TIME = 'all',
}

/**
 * Google search specific configuration
 */
export interface GoogleSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE;
  /** Safe search setting */
  safe?: 'active' | 'off';
  /** Device type for search */
  device?: 'desktop' | 'mobile' | 'tablet';
  /** Location for search */
  location?: string;
  /** Filter parameter */
  filter?: '0' | '1';
}

/**
 * Google News search specific configuration
 */
export interface GoogleNewsSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE_NEWS;
  /** News search modifier */
  /** Time-based search parameter */
  tbs?: string;
  /** Location for news search */
  location?: string;
}

/**
 * YouTube search specific configuration
 */
export interface YouTubeSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.YOUTUBE;
  /** YouTube search query parameter */
  search_query: string;
  /** Sort parameter for YouTube */
  sp?: string;
}

/**
 * Google Trends search specific configuration
 */
export interface GoogleTrendsSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE_TRENDS;
  /** Data type for trends */
  data_type?: 'TIMESERIES' | 'GEO_MAP' | 'RELATED_TOPICS' | 'RELATED_QUERIES';
  /** Geographic location */
  geo?: string;
  /** Date range */
  date?: string;
  /** Category ID */
  cat?: number;
  /** Google property filter */
  gprop?: string;
}

/**
 * Google Maps search specific configuration (engine=google_maps)
 */
export interface GoogleMapsSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE_MAPS;
  /** GPS coordinates of the location for results, in the form `@lat,lng,zoom` (e.g. `@40.7455096,-74.0083012,14z`). Effectively required once pagination via `start` is used. */
  ll?: string;
  /** Result type: `search` (keyword search, default) or `place` (needs a place_id token). */
  type?: string;
}

/**
 * Google Scholar search specific configuration (engine=google_scholar)
 */
export interface GoogleScholarSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE_SCHOLAR;
  /** Lower bound of publication year range (vendor param, e.g. 2018). */
  as_ylo?: number;
  /** Upper bound of publication year range (vendor param, e.g. 2024). */
  as_yhi?: number;
}

/**
 * Google Images search specific configuration (engine=google_images)
 */
export interface GoogleImagesSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE_IMAGES;
  /** Page index for image pagination (vendor param; 0-based). */
  ijn?: number;
}

/**
 * Google Shopping search specific configuration (engine=google_shopping)
 */
export interface GoogleShoppingSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE_SHOPPING;
}

/**
 * Google Jobs search specific configuration (engine=google_jobs)
 */
export interface GoogleJobsSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE_JOBS;
  /** Location for job search (free text, resolved server-side). */
  location?: string;
  /** Listing type filter, e.g. `1` for work-from-home. */
  ltype?: string;
  /** Pagination token from a previous response. */
  next_page_token?: string;
}

/**
 * Google Lens search specific configuration (engine=google_lens)
 */
export interface GoogleLensSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE_LENS;
  /** URL of the image to analyze (required). */
  url: string;
  /** Country code for results (own param, not the 2-char `gl` validator). */
  country?: string;
  /** Search type, e.g. `all`, `products`, `visual_matches`. */
  type?: string;
}

/**
 * Google Local Services search specific configuration (engine=google_local_services)
 */
export interface GoogleLocalServicesSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE_LOCAL_SERVICES;
  /** Region/customer id (data_cid) identifying the local-services area (required). */
  data_cid: string;
}

/**
 * Apple App Store search specific configuration (engine=apple_app_store)
 */
export interface AppleAppStoreSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.APPLE_APP_STORE;
  /** Search term (required). */
  term: string;
  /** Two-letter country code (own param, not the 2-char `gl` validator). */
  country?: string;
  /** Language code (own param, not the 2-char `hl` validator). */
  lang?: string;
}

/**
 * Google Play search specific configuration (engine=google_play)
 */
export interface GooglePlaySearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.GOOGLE_PLAY;
  /** Store section: `apps`, `games`, `movies`, or `books`. */
  store?: string;
  /** Apps category filter. */
  apps_category?: string;
  /** Pagination token from a previous response. */
  next_page_token?: string;
}

/**
 * Yelp search specific configuration (engine=yelp)
 */
export interface YelpSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.YELP;
  /** What to search for, e.g. a business category or name (required). */
  find_desc: string;
  /** Where to search, e.g. a city or address (required). */
  find_loc: string;
  /** Attribute filters. */
  attrs?: string;
  /** Sort order: `recommended`, `rating`, or `review_count`. */
  sortby?: string;
  /** Yelp domain, e.g. `yelp.com`. */
  yelp_domain?: string;
}

/**
 * Walmart search specific configuration (engine=walmart)
 */
export interface WalmartSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.WALMART;
  /** Search query. The Walmart engine requires the param named `query` (not `q`). */
  query?: string;
  /** Page number for pagination. */
  page?: number;
  /** Sort order, e.g. `price_low`, `best_seller`. */
  sort?: string;
  /** Minimum price filter. */
  min_price?: number;
  /** Maximum price filter. */
  max_price?: number;
  /** Minimum rating filter. */
  min_rating?: number;
  /** Store id to scope results. */
  store_id?: string;
}

/**
 * Bing search specific configuration (engine=bing)
 */
export interface BingSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.BING;
  /** Country code (own param, not the 2-char `gl` validator). */
  cc?: string;
  /** Market locale, e.g. `en-US` (own param). */
  mkt?: string;
  /** Number of results to return (vendor param). */
  count?: number;
  /** Index of the first result for pagination (vendor param). */
  first?: number;
}

/**
 * DuckDuckGo search specific configuration (engine=duckduckgo)
 */
export interface DuckDuckGoSearchConfig extends BaseSerpApiConfig {
  engine: SerpApiEngine.DUCKDUCKGO;
  /** Region locale, e.g. `us-en` (own param, not the 2-char `gl`/`hl` validators). */
  kl?: string;
}

/**
 * Union type for all possible SerpApi configurations
 */
export type SerpApiConfig =
  | GoogleSearchConfig
  | GoogleNewsSearchConfig
  | YouTubeSearchConfig
  | GoogleTrendsSearchConfig
  | GoogleMapsSearchConfig
  | GoogleScholarSearchConfig
  | GoogleImagesSearchConfig
  | GoogleShoppingSearchConfig
  | GoogleJobsSearchConfig
  | GoogleLensSearchConfig
  | GoogleLocalServicesSearchConfig
  | AppleAppStoreSearchConfig
  | GooglePlaySearchConfig
  | YelpSearchConfig
  | WalmartSearchConfig
  | BingSearchConfig
  | DuckDuckGoSearchConfig;

/**
 * Sort options for different search types
 */
export enum SortBy {
  RELEVANCE = 'relevance',
  DATE = 'date',
  UPLOAD_DATE = 'upload_date',
  VIEW_COUNT = 'view_count',
  RATING = 'rating',
}

/**
 * YouTube specific filters
 */
export enum YouTubeDuration {
  ANY = '',
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
}

export enum YouTubeQuality {
  ANY = '',
  HIGH = 'high',
}

/**
 * Error response from SerpApi
 */
export interface SerpApiError {
  error: string;
  message?: string;
  code?: number;
}

/**
 * Standard response wrapper for SerpApi
 */
export interface SerpApiResponse<T = any> {
  search_metadata?: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    total_time_taken: number;
  };
  search_parameters?: Record<string, any>;
  search_information?: {
    organic_results_state: string;
    query_displayed: string;
    total_results?: number;
  };
  data?: T;
  error?: string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Request options for HTTP calls
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}