import z from 'zod';

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
  query: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  order: orderOptions.optional(),
  live: liveStatusOptions.optional(),
  display_format: z.array(displayFormatOptions).optional(),
  publisher_platform: z.array(publisherPlatformOptions).optional(),
  niches: z.array(nicheOptions).optional(),
  market_target: z.array(marketTargetOptions).optional(),
  languages: z.array(languageOptions).optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(250).optional(),
});

export const getAdByIdSchema = z.object({
  ad_id: z.string().min(1, 'Ad ID is required'),
});

export const getAdsByPageSchema = z.object({
  page_id: z.string().min(1, 'Page ID is required'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  order: orderOptions.optional(),
  live: liveStatusOptions.optional(),
  display_format: z.array(displayFormatOptions).optional(),
  publisher_platform: z.array(publisherPlatformOptions).optional(),
  niches: z.array(nicheOptions).optional(),
  market_target: z.array(marketTargetOptions).optional(),
  languages: z.array(languageOptions).optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(250).optional(),
});

export const findBrandsSchema = z.object({
  query: z.string().min(1, 'Brand name is required'),
  limit: z.number().min(1).max(10).optional(),
});

export const findBoardsSchema = z.object({
  offset: z.number().min(0).optional(),
  limit: z.number().min(1).max(10).optional(),
});

// Trigger Schemas
export const newAdInBoardSchema = z.object({
  board_id: z.string().min(1, 'Board ID is required'),
  polling_interval: z.number().min(1).max(1440).optional(),
  live: liveStatusOptions.optional(),
  display_format: z.array(displayFormatOptions).optional(),
  publisher_platform: z.array(publisherPlatformOptions).optional(),
  niches: z.array(nicheOptions).optional(),
  market_target: z.array(marketTargetOptions).optional(),
  languages: z.array(languageOptions).optional(),
});

export const newAdInSpyderSchema = z.object({
  brand_id: z.string().min(1, 'Brand ID is required'),
  polling_interval: z.number().min(1).max(1440).optional(),
  live: liveStatusOptions.optional(),
  display_format: z.array(displayFormatOptions).optional(),
  publisher_platform: z.array(publisherPlatformOptions).optional(),
  niches: z.array(nicheOptions).optional(),
  market_target: z.array(marketTargetOptions).optional(),
  languages: z.array(languageOptions).optional(),
});

export const newSwipefileAdSchema = z.object({
  polling_interval: z.number().min(1).max(1440).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  live: liveStatusOptions.optional(),
  display_format: z.array(displayFormatOptions).optional(),
  publisher_platform: z.array(publisherPlatformOptions).optional(),
  niches: z.array(nicheOptions).optional(),
  market_target: z.array(marketTargetOptions).optional(),
  languages: z.array(languageOptions).optional(),
});
