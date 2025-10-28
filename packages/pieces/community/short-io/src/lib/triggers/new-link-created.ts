import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { shortIoAuth } from '../common/auth';
import { shortIoApiCall } from '../common/client';
import { domainIdDropdown } from '../common/props';

const LAST_LINK_IDS_KEY = 'shortio-last-link-ids';

export const newLinkCreatedTrigger = createTrigger({
  auth: shortIoAuth,
  name: 'new_link_created',
  displayName: 'New Link Created',
  description: 'Fires when a new short link is created on a domain. Useful to sync newly created links to other systems.',
  type: TriggerStrategy.POLLING,

  props: {
    domain: {
      ...domainIdDropdown,
      required: true,
      description: 'Select the domain to monitor for new links',
    },
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'How often to check for new links. More frequent polling may hit rate limits.',
      required: true,
      defaultValue: '5',
      options: {
        disabled: false,
        options: [
          { label: 'Every 1 minute', value: '1' },
          { label: 'Every 5 minutes', value: '5' },
          { label: 'Every 15 minutes', value: '15' },
          { label: 'Every 30 minutes', value: '30' },
          { label: 'Every hour', value: '60' },
        ],
      },
    }),
  },

  async onEnable(context) {
    const { domain: domainString } = context.propsValue;
    
    if (!domainString) {
      throw new Error('Domain is required. Please select a domain.');
    }

    const domainObject = JSON.parse(domainString as string);
    const domainId = domainObject.id;

    try {
      const response = await shortIoApiCall<{ links: ShortIoLink[] }>({
        auth: context.auth,
        method: HttpMethod.GET,
        resourceUri: `/api/links`,
        query: {
          domain_id: domainId,
          limit: 100,
          dateSortOrder: 'desc',
        },
      });

      const currentIds = (response.links || []).map((link) => link.idString);
      await context.store.put<string[]>(LAST_LINK_IDS_KEY, currentIds);
    } catch (error: any) {
      throw new Error(`Failed to initialize trigger: ${error.message}`);
    }
  },

  async onDisable() {
    // No-op 
  },

  async run(context) {
    const { domain: domainString } = context.propsValue;
    
    if (!domainString) {
      throw new Error('Domain is required. Please select a domain.');
    }

    const domainObject = JSON.parse(domainString as string);
    const domainId = domainObject.id;
    
    const previousIds = await context.store.get<string[]>(LAST_LINK_IDS_KEY) || [];

    try {
      const response = await shortIoApiCall<{ links: ShortIoLink[] }>({
        auth: context.auth,
        method: HttpMethod.GET,
        resourceUri: `/api/links`,
        query: {
          domain_id: domainId,
          limit: 100,
          dateSortOrder: 'desc',
        },
      });

      const allLinks = response.links || [];
      const currentIds = allLinks.map((link) => link.idString);

      await context.store.put<string[]>(LAST_LINK_IDS_KEY, currentIds);

      const newLinks = allLinks.filter((link) => !previousIds.includes(link.idString));

      return newLinks.map((link) => ({
        id: link.idString,
        originalURL: link.originalURL,
        shortURL: link.shortURL,
        secureShortURL: link.secureShortURL,
        title: link.title,
        path: link.path,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        tags: link.tags,
        redirectType: link.redirectType,
        domainId: link.DomainId || link.domainId,
        folderId: link.FolderId,
        ownerId: link.OwnerId,
        hasPassword: link.hasPassword,
        cloaking: link.cloaking,
        password: link.password,
        expiresAt: link.expiresAt,
        expiredURL: link.expiredURL,
        clicksLimit: link.clicksLimit,
        archived: link.archived,
        utmSource: link.utmSource,
        utmMedium: link.utmMedium,
        utmCampaign: link.utmCampaign,
        utmTerm: link.utmTerm,
        utmContent: link.utmContent,
        androidURL: link.androidURL,
        iphoneURL: link.iphoneURL,
        triggerInfo: {
          source: 'short.io',
          type: 'new_link_created',
          detectedAt: new Date().toISOString(),
          domain: domainObject.hostname,
        },
        raw: link,
      }));
    } catch (error: any) {
      if (error.message.includes('403')) {
        throw new Error(`Access denied to domain. Please check your API key permissions for domain: ${domainObject.hostname}`);
      }
      
      if (error.message.includes('404')) {
        throw new Error(`Domain not found: ${domainObject.hostname}. Please verify the domain exists.`);
      }
      
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Consider increasing the polling interval.');
      }

      throw new Error(`Failed to check for new links: ${error.message}`);
    }
  },

  async test(context) {
    const { domain: domainString } = context.propsValue;
    
    if (!domainString) {
      throw new Error('Domain is required. Please select a domain.');
    }

    const domainObject = JSON.parse(domainString as string);
    const domainId = domainObject.id;

    try {
      const response = await shortIoApiCall<{ links: ShortIoLink[] }>({
        auth: context.auth,
        method: HttpMethod.GET,
        resourceUri: `/api/links`,
        query: {
          domain_id: domainId,
          limit: 1,
          dateSortOrder: 'desc',
        },
      });

      const link = response.links?.[0];
      if (link) {
        return [{
          id: link.idString,
          originalURL: link.originalURL,
          shortURL: link.shortURL,
          secureShortURL: link.secureShortURL,
          title: link.title,
          path: link.path,
          createdAt: link.createdAt,
          updatedAt: link.updatedAt,
          tags: link.tags,
          redirectType: link.redirectType,
          domainId: link.DomainId || link.domainId,
          folderId: link.FolderId,
          ownerId: link.OwnerId,
          hasPassword: link.hasPassword,
          cloaking: link.cloaking,
          password: link.password,
          expiresAt: link.expiresAt,
          expiredURL: link.expiredURL,
          clicksLimit: link.clicksLimit,
          archived: link.archived,
          utmSource: link.utmSource,
          utmMedium: link.utmMedium,
          utmCampaign: link.utmCampaign,
          utmTerm: link.utmTerm,
          utmContent: link.utmContent,
          androidURL: link.androidURL,
          iphoneURL: link.iphoneURL,
          triggerInfo: {
            source: 'short.io',
            type: 'new_link_created',
            detectedAt: new Date().toISOString(),
            domain: domainObject.hostname,
          },
          raw: link,
        }];
      }

      return [];
    } catch (error: any) {
      if (error.message.includes('403')) {
        throw new Error(`Access denied to domain. Please check your API key permissions for domain: ${domainObject.hostname}`);
      }
      
      if (error.message.includes('404')) {
        throw new Error(`Domain not found: ${domainObject.hostname}. Please verify the domain exists.`);
      }

      throw new Error(`Failed to test trigger: ${error.message}`);
    }
  },

  sampleData: {
    id: 'lnk_61Mb_0dnRUg3vvtmAPZh3dhQh6',
    originalURL: 'https://example.com/page',
    shortURL: 'https://yourdomain.short.io/abc123',
    secureShortURL: 'https://yourdomain.short.io/abc123',
    title: 'Example Page Title',
    path: 'abc123',
    createdAt: '2025-01-15T12:00:00.000Z',
    updatedAt: '2025-01-15T12:00:00.000Z',
    tags: ['marketing', 'campaign'],
    redirectType: 302,
    domainId: 123456,
    folderId: null,
    ownerId: 789,
    hasPassword: false,
    cloaking: false,
    password: null,
    expiresAt: null,
    expiredURL: null,
    clicksLimit: null,
    archived: false,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'january_promo',
    utmTerm: null,
    utmContent: null,
    androidURL: null,
    iphoneURL: null,
    triggerInfo: {
      source: 'short.io',
      type: 'new_link_created',
      detectedAt: '2025-01-15T12:01:00.000Z',
      domain: 'yourdomain.short.io',
    },
    raw: {},
  },
});

interface ShortIoLink {
  idString: string;
  id: string;
  originalURL: string;
  shortURL: string;
  secureShortURL: string;
  title?: string;
  path: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  redirectType?: number;
  DomainId?: number;
  domainId?: number;
  FolderId?: string | null;
  OwnerId?: number;
  hasPassword?: boolean;
  cloaking?: boolean;
  password?: string | null;
  expiresAt?: string | number | null;
  expiredURL?: string | null;
  clicksLimit?: number | null;
  passwordContact?: boolean | null;
  skipQS?: boolean;
  archived?: boolean;
  splitURL?: string | null;
  splitPercent?: number | null;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  ttl?: string | number | null;
  androidURL?: string | null;
  iphoneURL?: string | null;
  integrationAdroll?: string | null;
  integrationFB?: string | null;
  integrationGA?: string | null;
  integrationGTM?: string | null;
  User?: {
    id: number;
    name: string | null;
    email: string;
    photoURL: string | null;
  };
  [key: string]: any;
}
