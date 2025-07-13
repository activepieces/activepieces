import { createAction } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId, emails, phones } from '../common/props';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribeUser = createAction({
  name: 'unsubscribe_user',
  displayName: 'Unsubscribe User',
  description: 'Unsubscribe one or more users by email or phone from a mailing list.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
    emails,
    phones,
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails, phones } = propsValue;
    if ((!emails || emails.length === 0) && (!phones || phones.length === 0)) {
      throw new Error('You must provide at least one email or phone to unsubscribe.');
    }
    const batch = [];
    if (emails && emails.length > 0) {
      batch.push(...emails);
    }
    if (phones && phones.length > 0) {
      batch.push(...phones);
    }
    if (batch.length === 0) {
      throw new Error('No valid emails or phones provided for unsubscribe.');
    }
    const body = { emails: batch };
    try {
      const data = await sendPulseApiCall({
        method: HttpMethod.POST,
        resourceUri: `/addressbooks/${addressBookId}/emails/unsubscribe`,
        body,
        auth,
      });
      return {
        success: true,
        message: `Unsubscribed ${batch.length} user(s) successfully`,
        data,
      };
    } catch (error) {
      throw new Error(`Failed to unsubscribe user(s): ${error.message}`);
    }
  },
}); 