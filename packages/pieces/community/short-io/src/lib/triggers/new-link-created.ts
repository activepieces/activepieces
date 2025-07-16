import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { shortIoAuth } from '../common/auth';
import { shortIoApiCall } from '../common/client';

const LAST_LINK_IDS_KEY = 'shortio-last-link-ids';

export const newLinkCreatedTrigger = createTrigger({
  auth: shortIoAuth,
  name: 'new_link_created',
  displayName: 'New Link Created',
  description: 'Fires when a new short link is created on the specified domain.',
  type: TriggerStrategy.POLLING,

  props: {
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'How often to check for new links.',
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
    domainId: Property.Number({
      displayName: 'Domain ID',
      description: 'The ID of your Short.io domain.',
      required: true,
    }),
  },

  async onEnable(context) {
    const { domainId } = context.propsValue;
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
  },

  async onDisable() {
    // No-op
  },

  async run(context) {
    const { domainId } = context.propsValue;
    const previousIds = await context.store.get<string[]>(LAST_LINK_IDS_KEY) || [];

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
      title: link.title,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      tags: link.tags,
      redirectType: link.redirectType,
      path: link.path,
      domainId: link.domainId,
      triggerInfo: {
        source: 'short.io',
        type: 'new_link',
        detectedAt: new Date().toISOString(),
      },
      raw: link,
    }));
  },

  async test(context) {
    const { domainId } = context.propsValue;

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
        title: link.title,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        tags: link.tags,
        redirectType: link.redirectType,
        path: link.path,
        domainId: link.domainId,
        triggerInfo: {
          source: 'short.io',
          type: 'new_link',
          detectedAt: new Date().toISOString(),
        },
        raw: link,
      }];
    }

    return [];
  },

  sampleData: {
    id: 'abc123',
    originalURL: 'https://example.com/page',
    shortURL: 'https://short.io/abc123',
    title: 'Example Link',
    createdAt: '2025-07-15T12:00:00.000Z',
    updatedAt: '2025-07-15T12:00:00.000Z',
    tags: ['marketing'],
    redirectType: 301,
    path: 'abc123',
    domainId: 123456,
    triggerInfo: {
      source: 'short.io',
      type: 'new_link',
      detectedAt: '2025-07-15T12:01:00.000Z',
    },
    raw: {},
  },
});

interface ShortIoLink {
  idString: string;
  originalURL: string;
  shortURL: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  redirectType?: number;
  path: string;
  domainId: number;
  [key: string]: any;
}
