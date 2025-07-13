import { createAction } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId, emails, variableName, variableValue } from '../common/props';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const changeVariableForSubscriber = createAction({
  name: 'change_variable_for_subscriber',
  displayName: 'Change Variable for Subscriber',
  description: 'Update a specific variable (field) for one or more subscribers by email.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
    emails,
    variableName,
    variableValue,
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails, variableName, variableValue } = propsValue;
    if (!emails || emails.length === 0) {
      throw new Error('You must provide at least one email to update variable.');
    }
    const results = [];
    for (const email of emails) {
      try {
        const data = await sendPulseApiCall({
          method: HttpMethod.PUT,
          resourceUri: `/addressbooks/${addressBookId}/emails/variable`,
          body: {
            email,
            variables: { [variableName]: variableValue },
          },
          auth,
        });
        results.push({ success: true, email, data });
      } catch (error) {
        results.push({ success: false, email, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return {
      message: `Variable update attempted for ${emails.length} subscriber(s)`,
      results,
    };
  },
}); 