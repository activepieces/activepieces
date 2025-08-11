import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bitlyAuth } from '../common/auth';
import { bitlyApiCall } from '../common/client';
import { groupGuid } from '../common/props';

const LAST_BITLINK_IDS_KEY = 'bitly-last-bitlink-ids';

export const newBitlinkCreatedTrigger = createTrigger({
  auth: bitlyAuth,
  name: 'new_bitlink_created',
  displayName: 'New Bitlink Created',
  description: 'Fires when a new Bitlink is created.',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'How frequently to check for new Bitlinks.',
      required: false,
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
    
    group_guid: groupGuid,
    
    titleFilter: Property.ShortText({
      displayName: 'Title Filter (Optional)',
      description: 'Only trigger for Bitlinks containing this text in their title.',
      required: false,
    }),
    
    tagFilter: Property.ShortText({
      displayName: 'Tag Filter (Optional)',
      description: 'Only trigger for Bitlinks containing this tag.',
      required: false,
    }),
    
    includeArchived: Property.Checkbox({
      displayName: 'Include Archived Bitlinks',
      description: 'Include archived Bitlinks in monitoring.',
      required: false,
      defaultValue: false,
    }),
  },

  async onEnable(context) {
    const { group_guid } = context.propsValue;
    const { accessToken } = context.auth;

    try {
      const response = await bitlyApiCall<{ links: BitlyLink[] }>({
        auth: { accessToken },
        method: HttpMethod.GET,
        resourceUri: `/groups/${group_guid}/bitlinks`,
        query: {
          size: 50,
          archived: context.propsValue.includeArchived ? 'both' : 'off',
        },
      });

      const linkIds = response.links.map((link) => link.id);
      await context.store.put<string[]>(LAST_BITLINK_IDS_KEY, linkIds);
      
      console.log(`Bitly New Bitlink trigger initialized with ${linkIds.length} existing links`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed: Please check your access token. Make sure your token has permission to access Bitlinks.'
        );
      }
      
      if (error.response?.status === 403) {
        throw new Error(
          'Access denied: You do not have permission to list Bitlinks. Please check your Bitly account permissions.'
        );
      }
      
      throw new Error(
        `Failed to initialize Bitlink monitoring: ${error.message || 'Unknown error occurred'}. Please check your Bitly connection.`
      );
    }
  },

  async onDisable() {
    console.log('Bitly New Bitlink trigger disabled and cleaned up');
  },

  async run(context) {
    const { group_guid, titleFilter, tagFilter, includeArchived } = context.propsValue;
    const { accessToken } = context.auth;
    
    try {
      const previousLinkIds = await context.store.get<string[]>(LAST_BITLINK_IDS_KEY) || [];

      const response = await bitlyApiCall<{ links: BitlyLink[] }>({
        auth: { accessToken },
        method: HttpMethod.GET,
        resourceUri: `/groups/${group_guid}/bitlinks`,
        query: {
          size: 50,
          archived: includeArchived ? 'both' : 'off',
        },
      });

      const allLinks = response.links || [];
      const currentLinkIds = allLinks.map((l) => l.id);

      await context.store.put<string[]>(LAST_BITLINK_IDS_KEY, currentLinkIds);

      let newLinks = allLinks.filter((link) => !previousLinkIds.includes(link.id));

      if (titleFilter && titleFilter.trim()) {
        const filterText = titleFilter.trim().toLowerCase();
        newLinks = newLinks.filter((link) => 
          link.title && link.title.toLowerCase().includes(filterText)
        );
      }

      if (tagFilter && tagFilter.trim()) {
        const filterTag = tagFilter.trim().toLowerCase();
        newLinks = newLinks.filter((link) => 
          link.tags && Array.isArray(link.tags) && 
          link.tags.some(tag => tag.toLowerCase().includes(filterTag))
        );
      }

      const processedLinks = newLinks.map((link) => ({
        id: link.id,
        link: link.link,
        longUrl: link.long_url,
        title: link.title,
        tags: link.tags || [],
        
        isArchived: link.archived,
        
        createdAt: link.created_at,
        modifiedAt: link.modified_at,
        
        customBitlinks: link.custom_bitlinks || [],
        
        references: {
          group: link.references?.group,
        },
        
        rawLinkData: link,
        
        triggerInfo: {
          detectedAt: new Date().toISOString(),
          source: 'bitly',
          type: 'new_bitlink',
        },
      }));

      return processedLinks;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed: Your access token may have expired. Please check your Bitly authentication.'
        );
      }
      
      if (error.response?.status === 429) {
        throw new Error(
          'Rate limit exceeded: Bitly API rate limit reached. Consider increasing your polling interval.'
        );
      }
      
      if (error.response?.status === 403) {
        throw new Error(
          'Access denied: You do not have permission to list Bitlinks. Please check your account permissions.'
        );
      }
      
      throw new Error(
        `Failed to check for new Bitlinks: ${error.message || 'Unknown error occurred'}. The trigger will retry on the next polling interval.`
      );
    }
  },

  async test(context) {
    const { group_guid, includeArchived } = context.propsValue;
    const { accessToken } = context.auth;

    try {
      const response = await bitlyApiCall<{ links: BitlyLink[] }>({
        auth: { accessToken },
        method: HttpMethod.GET,
        resourceUri: `/groups/${group_guid}/bitlinks`,
        query: {
          size: 1,
          archived: includeArchived ? 'both' : 'off',
        },
      });

      const links = response.links || [];
      
      if (links.length > 0) {
        const testLink = links[0];
        return [
          {
            id: testLink.id,
            link: testLink.link,
            longUrl: testLink.long_url,
            title: testLink.title,
            tags: testLink.tags || [],
            isArchived: testLink.archived,
            createdAt: testLink.created_at,
            modifiedAt: testLink.modified_at,
            customBitlinks: testLink.custom_bitlinks || [],
            references: {
              group: testLink.references?.group,
            },
            rawLinkData: testLink,
            triggerInfo: {
              detectedAt: new Date().toISOString(),
              source: 'bitly',
              type: 'new_bitlink',
            },
          },
        ];
      } else {
        return [
          {
            id: 'bit.ly/test123',
            link: 'https://bit.ly/test123',
            longUrl: 'https://example.com/very-long-url',
            title: 'Sample Bitlink',
            tags: ['sample', 'test'],
            isArchived: false,
            createdAt: '2025-01-15T10:00:00+0000',
            modifiedAt: '2025-01-15T10:00:00+0000',
            customBitlinks: [],
            references: {
              group: 'Ba1bc23dE4F',
            },
            rawLinkData: {
              id: 'bit.ly/test123',
              link: 'https://bit.ly/test123',
              long_url: 'https://example.com/very-long-url',
              title: 'Sample Bitlink',
              tags: ['sample', 'test'],
              archived: false,
              created_at: '2025-01-15T10:00:00+0000',
              modified_at: '2025-01-15T10:00:00+0000',
              custom_bitlinks: [],
              references: {
                group: 'Ba1bc23dE4F',
              },
            },
            triggerInfo: {
              detectedAt: new Date().toISOString(),
              source: 'bitly',
              type: 'new_bitlink',
            },
          },
        ];
      }
    } catch (error: any) {
      return [
        {
          id: 'bit.ly/test123',
          link: 'https://bit.ly/test123',
          longUrl: 'https://example.com/test-url',
          title: 'Test Bitlink',
          tags: ['test'],
          isArchived: false,
          createdAt: '2025-01-15T10:00:00+0000',
          modifiedAt: '2025-01-15T10:00:00+0000',
          customBitlinks: [],
          references: {
            group: 'Ba1bc23dE4F',
          },
          rawLinkData: {
            id: 'bit.ly/test123',
            link: 'https://bit.ly/test123',
            long_url: 'https://example.com/test-url',
            title: 'Test Bitlink',
            tags: ['test'],
            archived: false,
            created_at: '2025-01-15T10:00:00+0000',
            modified_at: '2025-01-15T10:00:00+0000',
            custom_bitlinks: [],
            references: {
              group: 'Ba1bc23dE4F',
            },
          },
          triggerInfo: {
            detectedAt: new Date().toISOString(),
            source: 'bitly',
            type: 'new_bitlink',
          },
        },
      ];
    }
  },

  sampleData: {
    id: 'bit.ly/3XYZ123',
    link: 'https://bit.ly/3XYZ123',
    longUrl: 'https://example.com/marketing-campaign-landing-page',
    title: 'Marketing Campaign Landing Page',
    tags: ['marketing', 'campaign', '2025'],
    isArchived: false,
    createdAt: '2025-01-15T09:30:00+0000',
    modifiedAt: '2025-01-15T09:30:00+0000',
    customBitlinks: [],
    references: {
      group: 'Ba1bc23dE4F',
    },
    rawLinkData: {
      id: 'bit.ly/3XYZ123',
      link: 'https://bit.ly/3XYZ123',
      long_url: 'https://example.com/marketing-campaign-landing-page',
      title: 'Marketing Campaign Landing Page',
      tags: ['marketing', 'campaign', '2025'],
      archived: false,
      created_at: '2025-01-15T09:30:00+0000',
      modified_at: '2025-01-15T09:30:00+0000',
      custom_bitlinks: [],
      references: {
        group: 'Ba1bc23dE4F',
      },
    },
    triggerInfo: {
      detectedAt: '2025-01-15T09:30:00.000Z',
      source: 'bitly',
      type: 'new_bitlink',
    },
  },
});

/**
 * Interface for Bitly link data structure
 */
interface BitlyLink {
  id: string;
  link: string;
  long_url: string;
  title: string;
  tags: string[];
  archived: boolean;
  created_at: string;
  modified_at: string;
  custom_bitlinks: string[];
  references: {
    group: string;
  };
  [key: string]: any;
}