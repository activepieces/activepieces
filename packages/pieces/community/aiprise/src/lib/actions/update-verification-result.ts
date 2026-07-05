import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../common/auth';

export const updateVerificationResultAction = createAction({
  auth: aipriseAuth,
  name: 'update_verification_result',
  displayName: 'Override Identity Verification Decision',
  description:
    'Manually changes the outcome of an identity check — useful when a human reviewer needs to approve or decline a case that AiPrise flagged for manual review.',
  audience: 'both',
  aiMetadata: {
    description:
      'Manually overrides the decision on an existing identity verification, setting it to Approved, Declined, Review (back to manual review), or Deactivated. Use this to implement a human-review/escalation step on a case AiPrise flagged. Requires the verification session ID and the target decision. Idempotent — it sets the decision to an explicit value, so repeating the same call leaves the case in the same state.',
    idempotent: true,
  },
  props: {
    verification_session_id: Property.ShortText({
      displayName: 'Verification Session ID',
      description:
        'The ID of the verification whose decision you want to change. You can get this from the output of the **Start Identity Verification** action, or from the **session_id** field in any webhook payload from AiPrise.',
      required: true,
    }),
    result: Property.StaticDropdown({
      displayName: 'New Decision',
      description:
        'The outcome you want to set. Choose **Approved** to pass the person, **Declined** to reject them, or **Pending** to put the case back into manual review.',
      required: true,
      options: {
        options: [
          { label: 'Approved — pass the person', value: 'APPROVED' },
          { label: 'Declined — reject the person', value: 'DECLINED' },
          { label: 'Review — put in manual review', value: 'REVIEW' },
          {label: 'Deactivated — deactivate the profile', value: 'DEACTIVATED' },
        ],
      },
    }),
  },
  async run(context) {
    const { verification_session_id, result } = context.propsValue;
    const response = await aiprise.makeRequest<Record<string, unknown>>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/verify/update_user_verification_result',
      body: { verification_session_id, result },
    });
    return response;
  },
});
