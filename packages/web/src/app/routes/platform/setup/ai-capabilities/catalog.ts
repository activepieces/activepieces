import { AiToolCapability, AiToolProvider } from '@activepieces/shared';
import { t } from 'i18next';

export type AiToolProviderInfo = {
  id: AiToolProvider;
  name: string;
  description: string;
  signupUrl: string;
};

export type AiToolCapabilityInfo = {
  capability: AiToolCapability;
  name: string;
  description: string;
  providers: AiToolProviderInfo[];
};

export const AI_TOOL_CATALOG: AiToolCapabilityInfo[] = [
  {
    capability: AiToolCapability.WEB_SEARCH,
    name: t('Web Search'),
    description: t(
      'Let the assistant search the live web for current information. When off, it falls back to the model’s built-in search if available.',
    ),
    providers: [
      {
        id: AiToolProvider.TAVILY,
        name: 'Tavily',
        description: t('Search API built for AI agents.'),
        signupUrl: 'https://app.tavily.com',
      },
    ],
  },
  {
    capability: AiToolCapability.WEB_SCRAPING,
    name: t('Web Scraping'),
    description: t(
      'Let the assistant extract the full clean content of a web page as markdown, including JavaScript-rendered pages.',
    ),
    providers: [
      {
        id: AiToolProvider.FIRECRAWL,
        name: 'Firecrawl',
        description: t('Clean markdown extraction, handles JS-rendered pages.'),
        signupUrl: 'https://www.firecrawl.dev',
      },
      {
        id: AiToolProvider.APIFY,
        name: 'Apify',
        description: t('Heavy-duty crawling and content extraction.'),
        signupUrl: 'https://console.apify.com',
      },
    ],
  },
  {
    capability: AiToolCapability.IMAGE_GENERATION,
    name: t('Image Generation'),
    description: t(
      'Let the assistant generate images — realistic photos, marketing graphics with text, brand logos, and abstract art. The model is chosen automatically per request.',
    ),
    providers: [
      {
        id: AiToolProvider.FAL,
        name: 'fal.ai',
        description: t(
          'One key for Flux, Ideogram, Recraft and more — the assistant picks the right model.',
        ),
        signupUrl: 'https://fal.ai/dashboard/keys',
      },
    ],
  },
];
