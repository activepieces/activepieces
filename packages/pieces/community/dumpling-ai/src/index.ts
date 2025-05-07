import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  webSearch,
  searchNews,
  generateImage,
  scrapeWebsite,
  crawlWebsite,
  extractDocument
} from './lib/actions';

// Define authentication for Dumpling AI
export const dumplingAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Enter your Dumpling AI API key. You can find this in your Dumpling AI dashboard under Settings > API Keys.',
});

/**
 * Dumpling AI piece for Activepieces
 *
 * This piece integrates with Dumpling AI's multimodal capabilities to enable
 * web search, news search, image generation, website scraping/crawling,
 * and document data extraction directly from Activepieces flows.
 */
export const dumplingAi = createPiece({
  // Basic piece information
  displayName: 'Dumpling AI',
  description: 'Multimodal AI platform for web research, content generation, and document analysis',

  // Authentication and metadata
  auth: dumplingAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/dumpling-ai.png',

  // Categorization and attribution
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.CONTENT_AND_FILES
  ],
  authors: ['YourGitHubUsername'],

  // Available operations
  actions: [
    // Search capabilities
    webSearch,
    searchNews,

    // Content generation
    generateImage,

    // Web data extraction
    scrapeWebsite,
    crawlWebsite,

    // Document processing
    extractDocument
  ],
  triggers: [],
});
