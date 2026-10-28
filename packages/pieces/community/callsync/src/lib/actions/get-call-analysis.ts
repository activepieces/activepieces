import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callsyncAuth } from '../auth';
import { callsyncApiCall, flatten } from '../common/client';
import { callDropdown } from '../common/props';

export const getCallAnalysis = createAction({
  auth: callsyncAuth,
  name: 'get_call_analysis',
  classification: 'READ',
  displayName: 'Get Call AI Analysis',
  description: 'Gets the transcript, AI summary, sentiment and suggested next steps for a call.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the AI analysis of one CallSync call by its id: transcript, summary, sentiment, call reason and suggested tasks. Use after Find Calls or a CallSync trigger gives you the call id. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    call: callDropdown,
  },
  async run(context) {
    const response = await callsyncApiCall<{ data?: Record<string, unknown> | null }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: 'analysis',
      query: { call_id: context.propsValue.call },
    });
    if (!response.data) {
      throw new Error(
        'This call has no AI analysis yet. Turn on AI analysis for it in the CallSync dashboard, or try again once it finishes.'
      );
    }
    return flatten(response.data);
  },
});
