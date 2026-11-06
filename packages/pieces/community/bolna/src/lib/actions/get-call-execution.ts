import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bolnaaiAuth } from '../common/auth';
import { bolnaClient } from '../common/client';
import { bolnaSchemas } from '../common/schemas';

export const getCallExecution = createAction({
  auth: bolnaaiAuth,
  name: 'get_call_execution',
  displayName: 'Get Call Execution',
  description:
    'Get the status, transcript, summary, cost and recording of a Bolna call.',
  audience: 'both',
  classification: 'READ',
  outputSchema: bolnaSchemas.executionSchema,
  aiMetadata: {
    description:
      'Fetches one Bolna call execution by its execution ID (returned by Make Phone Call or List Agent Executions). Returns status, transcript, summary, conversation duration in seconds, total cost in cents, recording URL and extracted data. Transcript, summary and cost stay empty until status is "completed"; "call-disconnected" is not final, so poll again later.',
    idempotent: true,
  },
  props: {
    executionId: Property.ShortText({
      displayName: 'Execution ID',
      description: 'The execution ID returned when the call was placed.',
      required: true,
    }),
  },
  async run(context) {
    return bolnaClient.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/executions/${encodeURIComponent(context.propsValue.executionId.trim())}`,
    });
  },
});
