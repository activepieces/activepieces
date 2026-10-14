import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { specstreamAuth } from '../auth';
import { ListRecord, specstreamApi, specstreamRows } from '../common/client';

type RowsPage = { find_id: string; status: string; accepted_count: number; rows: ListRecord[] };

export const getListResultsAction = createAction({
  auth: specstreamAuth,
  name: 'get_list_results',
  classification: 'READ',
  displayName: 'Get List Results',
  description: 'Gets the matching rows of a list, each with the page it was read from.',
  audience: 'human',
  aiMetadata: {
    description:
      'Reads the rows of a SpecStream list by its list ID (from Find a List). Returns the status (running, completed, partial, failed, canceled or expired), the number of matching rows and the rows as flat objects keyed by column label, each with source_url and checked_at. Costs nothing and changes nothing.',
    idempotent: true,
  },
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The List ID returned by Find a List. It starts with fnd_.',
      required: true,
    }),
  },
  async run(context) {
    const listId = context.propsValue.listId.trim();
    const page = await specstreamApi.call<RowsPage>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v1/finds/${encodeURIComponent(listId)}/rows`,
    });
    return {
      list_id: page.find_id,
      status: page.status,
      number_of_rows: page.accepted_count,
      list_link: specstreamApi.listLink(page.find_id),
      rows: (page.rows ?? []).map((record) => specstreamRows.flatten(page.find_id, record)),
    };
  },
});
