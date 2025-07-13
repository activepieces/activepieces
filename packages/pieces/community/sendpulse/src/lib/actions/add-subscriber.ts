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
    if (!emails || emails.length === 0) {
      throw new Error('You must provide at least one email to add.');
    }
    const batch = [];
    for (const email of emails) {
      const subscriber: any = { email };
      let vars: any = {};
      if (variables && Object.keys(variables).length > 0) {
        vars = { ...variables };
      }
      // If a phone is provided for this email, add it as a variable
      if (phones && phones.length > 0) {
        // Optionally, you could match phones to emails by index or another logic
        // Here, we just add the first phone to all, or you can customize as needed
        vars["Phone"] = phones[0];
      }
      if (Object.keys(vars).length > 0) {
        subscriber.variables = vars;
      }
      batch.push(subscriber);
    }
    const body: any = { emails: batch };
    if (optInType) {
      body.optin = optInType;
    }
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
      throw new Error(`Failed to add subscriber(s): ${error instanceof Error ? error.message : String(error)}`);
    }
  },
}); 