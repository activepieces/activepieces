import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListAgentTestsOutputSchema } from '../../output-schemas';

export const listAgentTests = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_agent_tests',
  outputSchema: elevenlabsListAgentTestsOutputSchema,
  displayName: 'List Agent Tests',
  description: 'List agent tests',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists agent tests with their ids and names. Search by name and page with next_cursor. Use to find test ids for Run Agent Tests.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Text matched against the test name', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', description: 'Between 1 and 100', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { tests: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/agent-testing`,
      queryParams: { search: propsValue.search, page_size: propsValue.pageSize, cursor: propsValue.cursor },
    });
    return { ...response, count: response.tests.length };
  },
});
