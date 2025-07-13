import { createAction } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId, emails, phones, variableName, variableValue } from '../common/props';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const changeVariableForSubscriber = createAction({
  name: 'change_variable_for_subscriber',
  displayName: 'Change Variable for Subscriber',
  description: 'Update a specific variable (field) for one or more subscribers.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
    emails,
    phones,
    variableName,
    variableValue,
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails, phones, variableName, variableValue } = propsValue;
    if ((!emails || emails.length === 0) && (!phones || phones.length === 0)) {
      throw new Error('You must provide at least one email or phone to update variable.');
    }
    const batch = [];
    if (emails && emails.length > 0) {
      for (const email of emails) {
        batch.push({ email, variable: { [variableName]: variableValue } });
      }
    }
    if (phones && phones.length > 0) {
      for (const phone of phones) {
        batch.push({ phone, variable: { [variableName]: variableValue } });
      }
    }
    if (batch.length === 0) {
      throw new Error('No valid emails or phones provided for variable update.');
    }
    const results = [];
    for (const entry of batch) {
      try {
        const data = await sendPulseApiCall({
          method: HttpMethod.PUT,
          resourceUri: `/addressbooks/${addressBookId}/emails/variable`,
          body: entry,
          auth,
        });
        results.push({ success: true, entry, data });
      } catch (error) {
        results.push({ success: false, entry, error: error.message });
      }
    }
    return {
      message: `Variable update attempted for ${batch.length} subscriber(s)`,
      results,
    };
  },
}); 