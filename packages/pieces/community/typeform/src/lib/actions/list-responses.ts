import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformPage, TypeformRecord } from '../common';
import { responsesOutputSchema } from '../output-schemas';

export const listResponsesAction = createAction({
  auth: typeformAuth,
  name: 'list_responses',
  classification: 'SEARCH',
  displayName: 'Find Responses',
  description: 'Looks up responses to a form.',
  audience: 'both',
  aiMetadata: {
    description:
      'List responses to one Typeform form, newest first by default, with answers (each tied to a field ID from Get Form), hidden fields, score, submitted and landed time. Filter by text in the answers, a submitted time range, response type and response IDs. Responses from the last ~30 minutes may be missing; use the New Submission trigger for real-time data. Page Size up to 1000; for the next page pass the last token as Before. Read-only.',
    idempotent: true,
  },
  outputSchema: responsesOutputSchema,
  propertyGroups: [
    { key: 'form', display: 'section', label: 'Search in', icon: 'file', props: ['form_id', 'lag_info'] },
    {
      key: 'filters',
      display: 'section',
      label: 'Filters',
      icon: 'filter',
      props: ['query', 'since', 'until', 'responseType', 'includedResponseIds'],
    },
    { key: 'results', display: 'section', label: 'Results', icon: 'sliders', props: ['sort', 'pageSize'] },
  ],
  props: {
    form_id: typeformCommon.form,
    lag_info: Property.MarkDown({
      value: 'Responses from the last 30 minutes may be missing. Use the New Submission trigger for real-time data.',
      variant: MarkdownVariant.INFO,
    }),
    query: Property.ShortText({
      displayName: 'Search',
      description: 'Only responses containing this text in any answer or hidden field.',
      required: false,
    }),
    since: Property.DateTime({
      displayName: 'Submitted After',
      required: false,
      width: 'half',
    }),
    until: Property.DateTime({
      displayName: 'Submitted Before',
      required: false,
      width: 'half',
    }),
    responseType: Property.StaticDropdown({
      displayName: 'Response Type',
      description: 'Leave empty for completed responses only.',
      required: false,
      options: {
        options: [
          { label: 'Completed', value: 'completed' },
          { label: 'Partial', value: 'partial' },
          { label: 'Started', value: 'started' },
        ],
      },
    }),
    includedResponseIds: Property.Array({
      displayName: 'Response IDs',
      description: 'Only return the responses with these IDs.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Leave empty for newest first.',
      required: false,
      width: 'half',
      options: {
        options: [
          { label: 'Newest first', value: 'submitted_at,desc' },
          { label: 'Oldest first', value: 'submitted_at,asc' },
        ],
      },
    }),
    pageSize: Property.Number({
      displayName: 'Max Responses',
      description: '1 to 1000. Leave empty for 25.',
      required: false,
      width: 'half',
    }),
    before: Property.ShortText({
      displayName: 'Before Response',
      description: 'Response token. Returns responses submitted before it, for paging.',
      required: false,
      advanced: true,
    }),
    after: Property.ShortText({
      displayName: 'After Response',
      description: 'Response token. Returns responses submitted after it.',
      required: false,
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = typeformCommon.toStringList({ values: propsValue.includedResponseIds });
    return typeformCommon.typeformRequest<TypeformPage<TypeformRecord>>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: `/forms/${encodeURIComponent(propsValue.form_id)}/responses`,
      queryParams: {
        query: propsValue.query?.trim(),
        since: propsValue.since,
        until: propsValue.until,
        response_type: propsValue.responseType,
        included_response_ids: ids.length > 0 ? ids.join(',') : undefined,
        sort: propsValue.sort,
        before: propsValue.before?.trim(),
        after: propsValue.after?.trim(),
        page_size: typeformCommon.pageQuery({ page: undefined, pageSize: propsValue.pageSize, maxPageSize: 1000 })['page_size'],
      },
    });
  },
});
