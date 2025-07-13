import { createAction } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId, emails } from '../common/props';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribeUser = createAction({
  name: 'unsubscribe_user',
  displayName: 'Unsubscribe User',
  description: 'Unsubscribe one or more users by email from a mailing list.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
    emails,
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails } = propsValue;
    if (!emails || emails.length === 0) {
      throw new Error('You must provide at least one email to unsubscribe.');
    }
    const body = { emails };
    try {
      const data = await sendPulseApiCall({
        method: HttpMethod.POST,
        resourceUri: `/addressbooks/${addressBookId}/emails/unsubscribe`,
        body,
        auth,
      });
      return {
        success: true,
        message: `Unsubscribed ${emails.length} user(s) successfully`,
        data,
      };
    } catch (error) {
      throw new Error(`Failed to unsubscribe user(s): ${error instanceof Error ? error.message : String(error)}`);
    }
  },
}); 