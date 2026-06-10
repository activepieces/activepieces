import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parallelAuth } from '../auth';
import { parallelClient } from '../common/client';

export const extractAction = createAction({
  auth: parallelAuth,
  name: 'extract',
  displayName: 'Extract Web Content',
  description:
    'Extract clean, citation-aware content from specific web URLs. Up to 20 URLs per request.',
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'List of URLs to extract content from (max 20).',
      required: true,
    }),
    objective: Property.LongText({
      displayName: 'Objective',
      description:
        'Natural-language description of the goal driving the extraction. Used to focus excerpts on the most relevant content.',
      required: false,
    }),
    search_queries: Property.Array({
      displayName: 'Search Queries',
      description:
        'Optional keyword search queries used together with the objective to focus excerpts.',
      required: false,
    }),
    full_content: Property.Checkbox({
      displayName: 'Include Full Content',
      description:
        'When enabled, requests full markdown of each page in addition to excerpts. May increase latency.',
      required: false,
      defaultValue: false,
    }),
    max_chars_total: Property.Number({
      displayName: 'Max Total Characters',
      description: 'Upper bound on total characters across excerpts from all results.',
      required: false,
    }),
    session_id: Property.ShortText({
      displayName: 'Session ID',
      description: 'Optional session identifier to share context across search/extract calls.',
      required: false,
    }),
  },
  async run(context) {
    const urls = ((context.propsValue.urls ?? []) as unknown[]).filter(
      (u): u is string => typeof u === 'string' && u.trim().length > 0,
    );
    if (urls.length === 0) {
      throw new Error('At least one URL is required.');
    }

    const queries = ((context.propsValue.search_queries ?? []) as unknown[]).filter(
      (q): q is string => typeof q === 'string' && q.trim().length > 0,
    );

    const body: Record<string, unknown> = { urls };
    if (context.propsValue.objective) body['objective'] = context.propsValue.objective;
    if (queries.length) body['search_queries'] = queries;
    if (context.propsValue.max_chars_total !== undefined && context.propsValue.max_chars_total !== null) {
      body['max_chars_total'] = context.propsValue.max_chars_total;
    }
    if (context.propsValue.session_id) body['session_id'] = context.propsValue.session_id;
    if (context.propsValue.full_content) {
      body['advanced_settings'] = {
        full_content: { enabled: true },
      };
    }

    return await parallelClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/extract',
      body,
    });
  },
});
