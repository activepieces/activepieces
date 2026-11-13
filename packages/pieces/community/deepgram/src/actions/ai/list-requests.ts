import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { deepgramProps } from '../../common/props';
import { listRequestsOutputSchema } from '../../output-schemas';
import { listRequests, listRequestsAction } from '../list-requests';

const { project: _project, ...originalProps } = listRequestsAction.props;

export const listRequestsAiAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_list_requests',
  classification: 'SEARCH',
  displayName: 'List Requests (Agent)',
  description:
    'Lists past API requests of a Deepgram project with status, duration and cost.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists past API requests of a Deepgram project, newest first, with status code, audio duration and cost in USD, filterable by date range (YYYY-MM-DD or ISO date-time), endpoint, method and success. Use to audit usage or to find a request ID for deepgram_get_request. Returns one page; has_more is true when the page is full, so ask for the next page number. Read-only.',
    idempotent: true,
  },
  outputSchema: listRequestsOutputSchema,
  props: {
    project_id: deepgramProps.projectId(),
    ...originalProps,
  },
  async run(context) {
    const { project_id, ...input } = context.propsValue;
    return listRequests({
      apiKey: context.auth.secret_text,
      input: { ...input, project: project_id ?? undefined },
    });
  },
});
