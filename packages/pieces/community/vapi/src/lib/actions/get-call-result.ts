import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiFlatten } from '../common/flatten';
import { vapiOutputSchemas } from '../common/output-schemas';
import { callFetcher } from './get-call';

export const getCallResult = createAction({
  auth: vapiAuth,
  name: 'get_call_result',
  classification: 'READ',
  displayName: 'Get Call Result',
  description: 'Get the status, transcript, summary and cost of a call.',
  audience: 'ai',
  outputSchema: vapiOutputSchemas.callResult,
  aiMetadata: {
    description:
      'Returns the status and outcome of one Vapi call by its ID: status, ended reason, start/end time, duration in seconds, cost in USD, AI summary, full transcript, recording URL and success evaluation. Transcript, summary and recording are empty until status is "ended" (the analysis can arrive a few seconds after that). Get the ID from Place Call or Find Calls. Read-only.',
    idempotent: true,
  },
  props: {
    callId: Property.ShortText({ displayName: 'Call ID', description: 'ID of the call.', required: true }),
  },
  async run(context) {
    const call = await callFetcher.fetch({ apiKey: context.auth.secret_text, callId: context.propsValue.callId });
    return vapiFlatten.callResult(call);
  },
});
