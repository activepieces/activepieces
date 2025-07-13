import { createAction } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId, emails, variables } from '../common/props';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateSubscriber = createAction({
  name: 'update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Update one or more subscribers (by email) with new variables or details.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
    emails,
    variables,
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails, variables } = propsValue;
    if (!emails || emails.length === 0) {
      throw new Error('You must provide at least one email to update.');
    }
    const batch = [];
    for (const email of emails) {
      const subscriber: any = { email };
      if (variables && Object.keys(variables).length > 0) {
        subscriber.variables = { ...variables };
      }
      batch.push(subscriber);
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
      throw new Error(`Failed to update subscriber(s): ${error instanceof Error ? error.message : String(error)}`);
    }
  },
}); 