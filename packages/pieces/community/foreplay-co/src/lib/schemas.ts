import * as z from 'zod/mini'

// Common validation schemas for dropdown options
const orderOptions = z.enum([
  'newest',
  'oldest',
  'longest_running',
  'most_relevant',
]);
const liveStatusOptions = z.enum(['true', 'false']);
const displayFormatOptions = z.enum([
  'video',
  'carousel',
  'image',
  'dco',
  'dpa',
  'multi_images',
  'multi_videos',
  'multi_medias',
  'event',
  'text',
]);
const publisherPlatformOptions = z.enum([
  'facebook',
  'instagram',
  'audience_network',
  'messenger',
  'tiktok',
  'youtube',
  'linkedin',
  'threads',
]);
const nicheOptions = z.enum([
  'accessories',
  'app/software',
  'beauty',
  'business/professional',
  'education',
  'entertainment',
  'fashion',
  'finance',
  'food',
  'health',
  'home',
  'pets',
  'sports',
  'technology',
  'travel',
  'automotive',
  'other',
]);
const marketTargetOptions = z.enum(['b2b', 'b2c']);
const languageOptions = z.enum([
  'english',
  'french',
  'german',
  'italian',
  'dutch, flemish',
  'spanish',
  'portuguese',
  'romanian',
  'russian',
  'chinese',
  'japanese',
  'korean',
  'arabic',
  'hindi',
]);
const brandOrderOptions = z.enum(['most_ranked', 'least_ranked']);

// Action Schemas (Zod objects for validation)
export const findAdsSchema = z.object({
  query: z.optional(z.string()),
  start_date: z.optional(z.string()),
  end_date: z.optional(z.string()),
  order: z.optional(orderOptions),
  live: z.optional(liveStatusOptions),
  display_format: z.optional(z.array(displayFormatOptions)),
  publisher_platform: z.optional(z.array(publisherPlatformOptions)),
  niches: z.optional(z.array(nicheOptions)),
  market_target: z.optional(z.array(marketTargetOptions)),
  languages: z.optional(z.array(languageOptions)),
  cursor: z.optional(z.string()),
  limit: z.optional(z.number().check(z.minimum(1), z.maximum(250))),
});

export const getAdByIdSchema = z.object({
  ad_id: z.string().check(z.minLength(1, 'Ad ID is required')),
});

export const getAdsByPageSchema = z.object({
  page_id: z.string().check(z.minLength(1, 'Page ID is required')),
  start_date: z.optional(z.string()),
  end_date: z.optional(z.string()),
  order: z.optional(orderOptions),
  live: z.optional(liveStatusOptions),
  display_format: z.optional(z.array(displayFormatOptions)),
  publisher_platform: z.optional(z.array(publisherPlatformOptions)),
  niches: z.optional(z.array(nicheOptions)),
  market_target: z.optional(z.array(marketTargetOptions)),
  languages: z.optional(z.array(languageOptions)),
  cursor: z.optional(z.string()),
  limit: z.optional(z.number().check(z.minimum(1), z.maximum(250))),
});

export const findBrandsSchema = z.object({
  query: z.string().check(z.minLength(1, 'Brand name is required')),
  limit: z.optional(z.number().check(z.minimum(1), z.maximum(10))),
});

export const findBoardsSchema = z.object({
  offset: z.optional(z.number().check(z.minimum(0))),
  limit: z.optional(z.number().check(z.minimum(1), z.maximum(10))),
});

// Trigger Schemas
export const newAdInBoardSchema = z.object({
  board_id: z.string().check(z.minLength(1, 'Board ID is required')),
  polling_interval: z.optional(z.number().check(z.minimum(1), z.maximum(1440))),
  live: z.optional(liveStatusOptions),
  display_format: z.optional(z.array(displayFormatOptions)),
  publisher_platform: z.optional(z.array(publisherPlatformOptions)),
  niches: z.optional(z.array(nicheOptions)),
  market_target: z.optional(z.array(marketTargetOptions)),
  languages: z.optional(z.array(languageOptions)),
});

export const newAdInSpyderSchema = z.object({
  brand_id: z.string().check(z.minLength(1, 'Brand ID is required')),
  polling_interval: z.optional(z.number().check(z.minimum(1), z.maximum(1440))),
  live: z.optional(liveStatusOptions),
  display_format: z.optional(z.array(displayFormatOptions)),
  publisher_platform: z.optional(z.array(publisherPlatformOptions)),
  niches: z.optional(z.array(nicheOptions)),
  market_target: z.optional(z.array(marketTargetOptions)),
  languages: z.optional(z.array(languageOptions)),
});

export const newSwipefileAdSchema = z.object({
  polling_interval: z.optional(z.number().check(z.minimum(1), z.maximum(1440))),
  start_date: z.optional(z.string()),
  end_date: z.optional(z.string()),
  live: z.optional(liveStatusOptions),
  display_format: z.optional(z.array(displayFormatOptions)),
  publisher_platform: z.optional(z.array(publisherPlatformOptions)),
  niches: z.optional(z.array(nicheOptions)),
  market_target: z.optional(z.array(marketTargetOptions)),
  languages: z.optional(z.array(languageOptions)),
});
