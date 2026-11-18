import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../common/client';
import { deepgramProjects } from '../common/projects';
import { deepgramProps } from '../common/props';
import { deepgramReports, RequestRow } from '../common/reports';
import { requestOutputSchema } from '../output-schemas';

export const getRequestAction = createAction({
  auth: deepgramAuth,
  name: 'get_request',
  classification: 'READ',
  displayName: 'Get Request',
  description:
    'Gets one past Deepgram request by ID with its status, duration and cost.',
  audience: 'human',
  aiMetadata: {
    description:
      'Returns one past Deepgram API request by its request ID with status code, completion time, audio duration and cost in USD. Use to check whether a callback transcription finished or what a call cost. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: requestOutputSchema,
  props: {
    project: deepgramProps.project(),
    requestId: Property.ShortText({
      displayName: 'Request ID',
      description:
        'The request ID returned by a Deepgram action, for example Create Transcription (Callback).',
      required: true,
    }),
  },
  async run(context) {
    return getRequest({
      apiKey: context.auth.secret_text,
      input: context.propsValue,
    });
  },
});

export async function getRequest({
  apiKey,
  input,
}: {
  apiKey: string;
  input: GetRequestInput;
}) {
  const requestId = (input.requestId ?? '').trim();
  if (requestId.length === 0) {
    throw new Error('Enter a request ID.');
  }
  const projectId = await deepgramProjects.resolveProjectId({
    apiKey,
    project: input.project,
  });
  const response = await deepgramClient.request<
    RequestRow & { request?: RequestRow }
  >({
    apiKey,
    method: HttpMethod.GET,
    path: deepgramProjects.projectPath({
      projectId,
      rest: ['requests', requestId],
    }),
    timeoutMs: DEEPGRAM_TIMEOUTS.manage,
    operation: 'get the request',
  });
  const row = response.body?.request ?? response.body;
  if (!row || !row.request_id) {
    throw new Error(
      `Deepgram has no request with ID ${requestId} in this project. Check the request ID and project; a request made in the last few minutes may not be listed yet.`
    );
  }
  return deepgramReports.flattenRequest(row);
}

export type GetRequestInput = {
  project?: string;
  requestId?: string;
};
