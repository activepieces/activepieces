import { createAction, Property } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateSubscriber = createAction({
  name: 'update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Update variables for one or more subscribers by email.',
  auth: sendPulseAuth,
  props: {
    addressBookId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'The ID of the SendPulse address book (mailing list)',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'List of email addresses to update',
      required: true,
    }),
    variables: Property.Array({
      displayName: 'Variables for Each Email',
      description: 'Optional JSON strings for each email (same order). Example: {"name":"John","Phone":"123456"}',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails, variables } = propsValue;
    if (!emails || emails.length === 0) {
      throw new Error('You must provide at least one email to update.');
    }
    if (!variables || variables.length !== emails.length) {
      throw new Error('You must provide a variables JSON string for each email (same order).');
    }
    const results = [];
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      let vars: any = {};
      if (variables[i]) {
        try {
          vars = JSON.parse(variables[i] as string);
        } catch (e) {
          results.push({ success: false, email, error: `Invalid JSON for variables at index ${i}: ${variables[i]}` });
          continue;
        }
      }
      try {
        const data = await sendPulseApiCall({
          method: HttpMethod.POST,
          resourceUri: `/addressbooks/${addressBookId}/emails`,
          body: {
            emails: [{ email, variables: vars }],
          },
          auth,
        });
        results.push({ success: true, email, data });
      } catch (error) {
        results.push({ success: false, email, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return {
      message: `Update attempted for ${emails.length} subscriber(s)`,
      results,
    };
  },
});

export const updateSubscriberPhone = createAction({
  auth: sendPulseAuth,
  name: 'update-subscriber-phone',
  displayName: 'Update Subscriber Phone Number',
  description: 'Update the phone number of an existing subscriber in a mailing list.',
  props: {
    addressBookId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'The ID of the SendPulse address book (mailing list)',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the subscriber to update',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The new phone number to assign to the subscriber',
      required: true,
    }),
  },
  async run(context) {
    const { addressBookId, email, phone } = context.propsValue;
    const body = { email, phone };
    try {
      const result = await sendPulseApiCall<{ result: boolean }>({
        method: HttpMethod.PUT,
        auth: context.auth,
        resourceUri: `/addressbooks/${addressBookId}/phone`,
        body,
      });
      if (result.result === true) {
        return {
          success: true,
          message: `Subscriber ${email}'s phone number was updated to ${phone}`,
        };
      }
      throw new Error('SendPulse API returned failure while updating phone.');
    } catch (error: any) {
      throw new Error(
        `SendPulse error: ${error.message || 'Unknown error while updating subscriber phone'}`
      );
    }
  },
}); 