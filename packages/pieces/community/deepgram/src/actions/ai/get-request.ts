import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { deepgramProps } from '../../common/props';
import { requestOutputSchema } from '../../output-schemas';
import { getRequest, getRequestAction } from '../get-request';

const { project: _project, ...originalProps } = getRequestAction.props;

export const getRequestAiAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_get_request',
  classification: 'READ',
  displayName: 'Get Request (Agent)',
  description:
    'Gets one past Deepgram request by ID with its status, duration and cost.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one past Deepgram API request by its request ID with status code, completion time, audio duration, cost in USD and callback delivery status. Get the ID from deepgram_list_requests or from the request_id that deepgram_transcribe_audio returns. Read-only.',
    idempotent: true,
  },
  outputSchema: requestOutputSchema,
  props: {
    project_id: deepgramProps.projectId(),
    ...originalProps,
  },
  async run(context) {
    const { project_id, ...input } = context.propsValue;
    return getRequest({
      apiKey: context.auth.secret_text,
      input: { ...input, project: project_id ?? undefined },
    });
  },
});
