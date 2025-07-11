import {
  Property,
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon, Design } from '../common';

interface ListDesignsResponse {
  items: Design[];
  continuation?: string;
}

export const findDesign = createAction({
  auth: canvaAuth,
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Search and list designs from your Canva library. Use this to find existing designs before creating new ones.',
  props: {
    query: Property.ShortText({
      displayName: '🔍 Search Query',
      description: 'Enter keywords to search designs by title or content (leave empty to get all designs)',
      required: false,
    }),
    ownership: Property.StaticDropdown({
      displayName: '👥 Ownership Filter',
      description: 'Filter designs by who owns them',
      required: false,
      defaultValue: 'any',
      options: {
        options: [
          { label: 'Any (owned + shared)', value: 'any' },
          { label: 'Owned by me', value: 'owned' },
          { label: 'Shared with me', value: 'shared' },
        ],
      },
    }),
    sort_by: Property.StaticDropdown({
      displayName: '📊 Sort By',
      description: 'How to order the search results',
      required: false,
      defaultValue: 'modified_descending',
      options: {
        options: [
          { label: '📅 Recently Modified (Recommended)', value: 'modified_descending' },
          { label: '🔍 Relevance', value: 'relevance' },
          { label: '📅 Oldest Modified', value: 'modified_ascending' },
          { label: '🔤 Title A-Z', value: 'title_ascending' },
          { label: '🔤 Title Z-A', value: 'title_descending' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: '⚙️ Result Limit (Advanced)',
      description: 'Max designs to return (default: 20, max: 100). Higher numbers may be slower.',
      required: false,
      defaultValue: 20,
    }),
    continuation: Property.ShortText({
      displayName: '⚙️ Continuation Token (Advanced)',
      description: 'For pagination: token from previous search to get next page of results',
      required: false,
    }),
  },
  async run(context) {
    const { query, ownership, sort_by, limit, continuation } = context.propsValue;
    const authValue = context.auth as OAuth2PropertyValue;

    try {
      const params = new URLSearchParams();
      
      if (query && query.trim()) {
        params.append('query', query.trim());
      }
      
      if (ownership && ownership !== 'any') {
        params.append('ownership', ownership);
      }
      
      if (sort_by && sort_by !== 'relevance') {
        params.append('sort_by', sort_by);
      }
      
      if (continuation && continuation.trim()) {
        params.append('continuation', continuation.trim());
      }

      const queryString = params.toString();
      const url = `${canvaCommon.baseUrl}/designs${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authValue.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 400) {
          throw new Error(`Bad Request: ${errorData.message || 'Invalid search parameters'}`);
        }
        
        if (response.status === 401) {
          throw new Error('Unauthorized: Please check your authentication credentials');
        }
        
        if (response.status === 403) {
          throw new Error('Forbidden: Insufficient permissions to access designs');
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded: Too many requests (limit: 100 per minute)');
        }
        
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Request failed'}`);
      }

      const data: ListDesignsResponse = await response.json();

      let designs = data.items || [];
      if (limit && limit > 0) {
        designs = designs.slice(0, Math.min(limit, 100));
      }

      return {
        designs,
        total_found: designs.length,
        has_more: !!data.continuation,
        continuation_token: data.continuation,
        search_query: query || null,
        ownership_filter: ownership || 'any',
        sort_order: sort_by || 'relevance',
        design_ids: designs.map(d => d.id),
        design_titles: designs.map(d => d.title).filter(Boolean),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to find designs: ${String(error)}`);
    }
  },
}); 