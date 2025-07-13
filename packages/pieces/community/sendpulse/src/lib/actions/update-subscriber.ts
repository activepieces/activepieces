import { createAction } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId, emails, phones, variables } from '../common/props';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateSubscriber = createAction({
  name: 'update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Update one or more subscribers (by email or phone) with new variables or details.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
    emails,
    phones,
    variables,
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails, phones, variables } = propsValue;
    if ((!emails || emails.length === 0) && (!phones || phones.length === 0)) {
      throw new Error('You must provide at least one email or phone for update.');
    }
    const batch = [];
    if (emails && emails.length > 0) {
      for (const email of emails) {
        batch.push({ email, variables });
      }
    }
    if (phones && phones.length > 0) {
      for (const phone of phones) {
        batch.push({ phone, variables });
      }
    }
    if (batch.length === 0) {
      throw new Error('No valid emails or phones provided for update.');
    }
    const body = { emails: batch };
    try {
      const data = await sendPulseApiCall({
        method: HttpMethod.PUT,
        resourceUri: `/addressbooks/${addressBookId}/emails`,
        body,
        auth,
      });
      return {
        success: true,
        message: `Updated ${batch.length} subscriber(s) successfully`,
        data,
      };
    } catch (error) {
      throw new Error(`Failed to update subscriber(s): ${error.message}`);
    }
  },
}); 