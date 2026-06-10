import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callFormsApi, googleFormsAuth, googleFormsCommon } from '../common/common';

export const listResponsesAction = createAction({
  auth: googleFormsAuth,
  name: 'list_responses',
  displayName: 'List Responses',
  description: 'Lists responses for a form. Supports an optional Google Forms filter (e.g. "timestamp > 2025-01-01T00:00:00Z").',
  props: {
    include_team_drives: googleFormsCommon.include_team_drives,
    form_id: googleFormsCommon.form_id,
    filter: Property.ShortText({
      displayName: 'Filter',
      description: 'Optional. Google Forms response filter. Only "timestamp" comparisons are supported (e.g. timestamp > 2025-01-01T00:00:00Z).',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Optional. Stop after collecting this many responses. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { form_id, filter, max_results } = context.propsValue;
    const cap = typeof max_results === 'number' && max_results > 0 ? max_results : 100;

    const responses: Record<string, unknown>[] = [];
    let pageToken: string | undefined = undefined;
    do {
      const queryParams: Record<string, string> = { pageSize: '1000' };
      if (filter && filter.length > 0) {
        queryParams['filter'] = filter;
      }
      if (pageToken) {
        queryParams['pageToken'] = pageToken;
      }
      const page = await callFormsApi<{
        responses?: Record<string, unknown>[];
        nextPageToken?: string;
      }>({
        auth: context.auth,
        method: HttpMethod.GET,
        path: `/forms/${form_id}/responses`,
        queryParams,
      });

      const batch = Array.isArray(page.responses) ? page.responses : [];
      for (const item of batch) {
        if (responses.length >= cap) break;
        responses.push(item);
      }
      pageToken = responses.length >= cap ? undefined : page.nextPageToken;
    } while (pageToken);

    return { count: responses.length, responses };
  },
});
