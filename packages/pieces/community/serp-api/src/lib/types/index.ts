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
 * Union type for all possible SerpApi configurations
 */
export type SerpApiConfig =
  | GoogleSearchConfig
  | GoogleNewsSearchConfig
  | YouTubeSearchConfig
  | GoogleTrendsSearchConfig;

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