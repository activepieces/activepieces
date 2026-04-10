import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const updateVerificationResultAction = createAction({
  auth: aipriseAuth,
  name: 'update_verification_result',
  displayName: 'Override Identity Verification Decision',
  description:
    'Manually changes the outcome of an identity check — useful when a human reviewer needs to approve or decline a case that AiPrise flagged for manual review.',
  props: {
    session_id: Property.ShortText({
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
          { label: 'Approved — pass the person', value: 'approved' },
          { label: 'Declined — reject the person', value: 'declined' },
          { label: 'Pending — send back to manual review', value: 'pending' },
        ],
      },
    }),
  },
  async run(context) {
    const { session_id, result } = context.propsValue;
    const response = await aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/update_user_verification_result',
      body: { session_id, result },
    });
    return response;
  },
});
