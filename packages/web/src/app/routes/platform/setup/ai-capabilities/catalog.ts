import { isNil } from '@activepieces/core-utils';
import {
  AI_PROVIDER_CAPABILITIES,
  AIProviderWithoutSensitiveData,
  AiToolCapability,
  AiToolProvider,
} from '@activepieces/shared';
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
      'Let the assistant search the live web for current information.',
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
      'Let the assistant generate images — realistic photos, marketing graphics with text, brand logos, and abstract art.',
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
  {
    capability: AiToolCapability.EMBEDDINGS,
    name: t('Embeddings'),
    description: t(
      'Index knowledge-base files so agents can search them. Pick one of your AI keys and its embedding model.',
    ),
    providers: [],
  },
];

function providerCovers({
  capability,
  provider,
}: {
  capability: AiToolCapability;
  provider: AIProviderWithoutSensitiveData;
}): boolean {
  const providerCapabilities = AI_PROVIDER_CAPABILITIES[provider.provider];
  switch (capability) {
    case AiToolCapability.WEB_SEARCH:
      return !isNil(providerCapabilities.webSearch);
    case AiToolCapability.IMAGE_GENERATION:
      return !isNil(providerCapabilities.defaultImageModel);
    case AiToolCapability.EMBEDDINGS:
      return providerCapabilities.supportsEmbedding;
    case AiToolCapability.WEB_SCRAPING:
      return false;
  }
}

function eligibleProviders({
  capability,
  providers,
}: {
  capability: AiToolCapability;
  providers: AIProviderWithoutSensitiveData[];
}): AIProviderWithoutSensitiveData[] {
  return providers.filter(
    (provider) =>
      provider.projectScope === 'all' &&
      providerCovers({ capability, provider }),
  );
}

function servesByDefault({
  capability,
  provider,
}: {
  capability: AiToolCapability;
  provider: AIProviderWithoutSensitiveData;
}): boolean {
  const defaultImageModel =
    AI_PROVIDER_CAPABILITIES[provider.provider].defaultImageModel;
  const defaultModelAllowed =
    capability !== AiToolCapability.IMAGE_GENERATION ||
    provider.modelScope !== 'selected' ||
    (!isNil(defaultImageModel) &&
      provider.modelIds.includes(defaultImageModel));
  if (capability === AiToolCapability.EMBEDDINGS) {
    return providerCovers({ capability, provider });
  }
  return (
    eligibleProviders({ capability, providers: [provider] }).length > 0 &&
    defaultModelAllowed
  );
}

export const aiCapabilitySources = {
  eligibleProviders,
  servesByDefault,
};
