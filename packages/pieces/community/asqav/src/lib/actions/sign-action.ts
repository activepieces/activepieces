import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asqavApiCall, getOrCreateAgent } from '../common';
import { asqavAuth } from '../auth';

export const signAction = createAction({
  name: 'sign_action',
  auth: asqavAuth,
  displayName: 'Sign Action',
  description:
    'Sign an agent action with Asqav and get back a tamper-evident receipt with a verification URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sign an action with a named Asqav agent and return a tamper-evident receipt with a verification URL. Use after a consequential step to record proof of what was done; to check an existing receipt use Verify Signature instead. Each call issues a new receipt, so retries create duplicate signatures.',
    idempotent: false,
  },
  props: {
    agentName: Property.ShortText({
      displayName: 'Agent Name',
      description:
        'The Asqav agent that signs this action. Reused when it already exists, created on first run.',
      required: true,
      defaultValue: 'activepieces',
    }),
    actionType: Property.ShortText({
      displayName: 'Action Type',
      description:
        'Namespaced identifier for the action being signed, in namespace:verb format, for example "payments:charge" or "email:send".',
      required: true,
    }),
    context: Property.Json({
      displayName: 'Context',
      description:
        'Optional JSON object of non-sensitive metadata bound into the signed receipt.',
      required: false,
    }),
    complianceMode: Property.Checkbox({
      displayName: 'Compliance Mode',
      description:
        'Request a policy-evaluated compliance receipt. Needs an active policy matching the action type in your Asqav organization.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const { agentName, actionType, complianceMode } = context.propsValue;

    const agent = await getOrCreateAgent(apiKey, agentName);

    const body: Record<string, unknown> = {
      action_type: actionType,
      context: context.propsValue.context ?? {},
      session_id: null,
    };
    if (complianceMode) {
      body['compliance_mode'] = true;
    }

    return asqavApiCall<Record<string, unknown>>({
      apiKey,
      method: HttpMethod.POST,
      resourceUri: `/agents/${agent.agent_id}/sign`,
      body,
    });
  },
});