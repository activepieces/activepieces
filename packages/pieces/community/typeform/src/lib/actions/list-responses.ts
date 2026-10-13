import { createAction, Property } from '@activepieces/pieces-framework';
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
  props: {
    form_id: typeformCommon.form,
    query: Property.ShortText({
      displayName: 'Search',
      description: 'Only responses containing this text in any answer or hidden field.',
      required: false,
    }),
    since: Property.DateTime({
      displayName: 'Submitted After',
      required: false,
    }),
    until: Property.DateTime({
      displayName: 'Submitted Before',
      required: false,
    }),
    responseType: Property.StaticDropdown({
      displayName: 'Response Type',
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
      description: 'Only these responses.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      options: {
        options: [
          { label: 'Submitted, newest first', value: 'submitted_at,desc' },
          { label: 'Submitted, oldest first', value: 'submitted_at,asc' },
        ],
      },
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'How many responses to return, from 1 to 1000. Default 25.',
      required: false,
    }),
    before: Property.ShortText({
      displayName: 'Before',
      description: 'Token of a response. Returns responses older than it, for the next page.',
      required: false,
    }),
    after: Property.ShortText({
      displayName: 'After',
      description: 'Token of a response. Returns responses newer than it.',
      required: false,
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
