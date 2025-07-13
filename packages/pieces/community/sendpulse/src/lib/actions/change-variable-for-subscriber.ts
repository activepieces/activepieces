import { createAction, Property } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId, emails } from '../common/props';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const changeVariableForSubscriber = createAction({
  name: 'change_variable_for_subscriber',
  displayName: 'Change Variables for Subscriber',
  description: 'Update variables for one or more subscribers by email. Each email can have its own set of variables.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
    emails,
    variables: Property.Array({
      displayName: 'Variables for Each Email',
      description: 'Optional JSON strings for each email (same order). Example: {"name":"John","Phone":"123456"}',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails, variables } = propsValue;
    if (!emails || emails.length === 0) {
      throw new Error('You must provide at least one email to update variables.');
    }
    if (!variables || variables.length !== emails.length) {
      throw new Error('You must provide a variables JSON string for each email (same order).');
    }
    const results = [];
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      let vars = {};
      if (variables[i]) {
        try {
          vars = JSON.parse(String(variables[i]));
        } catch (e) {
          results.push({ success: false, email, error: `Invalid JSON for variables at index ${i}: ${variables[i]}` });
          continue;
        }
      }
      try {
        const data = await sendPulseApiCall({
          method: HttpMethod.PUT,
          resourceUri: `/addressbooks/${addressBookId}/emails/variable`,
          body: {
            email,
            variables: vars,
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
  }
}); 