import { createAction } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId, emails, phones, variables, optInType } from '../common/props';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addSubscriber = createAction({
  name: 'add_subscriber',
  displayName: 'Add Subscriber',
  description: 'Add one or more subscribers to a mailing list.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
    emails,
    phones,
    variables,
    optInType,
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails, phones, variables, optInType } = propsValue;
    if ((!emails || emails.length === 0) && (!phones || phones.length === 0)) {
      throw new Error('You must provide at least one email or phone to add.');
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
      throw new Error('No valid emails or phones provided for addition.');
    }
    const body = { emails: batch, optin: optInType };
    try {
      const data = await sendPulseApiCall({
        method: HttpMethod.POST,
        resourceUri: `/addressbooks/${addressBookId}/emails`,
        body,
        auth,
      });
      return {
        success: true,
        message: `Added ${batch.length} subscriber(s) successfully`,
        data,
      };
    } catch (error) {
      throw new Error(`Failed to add subscriber(s): ${error.message}`);
    }
  },
}); 