import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { HedyApiClient } from './client';
import { PaginatedResponse, Topic } from './types';

function toTopicArray(result: unknown): Topic[] {
  if (Array.isArray(result)) {
    return result as Topic[];
  }

  if (result && typeof result === 'object' && 'data' in result) {
    const data = (result as PaginatedResponse<Topic>).data;
    if (Array.isArray(data)) {
      return data;
    }
  }

  return [];
}

export const topicDropdown = Property.Dropdown({
  displayName: 'Topic',
  description: 'Optionally filter results by a specific topic.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Hedy account first.',
      };
    }

    const client = new HedyApiClient(auth as string);
    try {
      const response = await client.request<Topic[]>({
        method: HttpMethod.GET,
        path: '/topics',
      });

      const topics = toTopicArray(response);

      if (topics.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No topics found in your Hedy workspace.',
        };
      }

      return {
        disabled: false,
        options: topics.map((topic) => ({
          label: topic.name,
          value: topic.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder:
          error instanceof Error ? error.message : 'Failed to load topics. Check your connection.',
      };
    }
  },
});
