import { createAction, Property } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addSubscriber = createAction({
  auth: sendPulseAuth,
  name: 'add-subscriber',
  displayName: 'Add Emails to Mailing List',
  description: 'Adds one or more emails to a mailing list (single-opt-in).',
  props: {
    addressBookId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'ID of the SendPulse address book (mailing list)',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'List of email addresses (e.g., user@example.com)',
      required: true,
    }),
    variables: Property.Array({
      displayName: 'Variables for Each Email',
      description: 'Optional JSON strings for each email (same order). Example: {"name":"John","Phone":"123456"}',
      required: false,
    }),
    tags: Property.Object({
      displayName: 'Tag IDs',
      description: 'Optional object with tag IDs, e.g., {"0": 123, "1": 456}',
      required: false,
    }),
  },

  async run(context) {
    const { addressBookId, emails, variables, tags } = context.propsValue;
    const formattedEmails: any[] = [];
    for (let i = 0; i < emails.length; i++) {
      const item: any = { email: emails[i] };
      if (variables && variables[i]) {
        try {
          const parsed = JSON.parse(variables[i] as string);
          item.variables = parsed;
        } catch (e) {
          throw new Error(`Invalid JSON for variables at index ${i}: ${variables[i]}`);
        }
      }
      formattedEmails.push(item);
    }
    const requestBody: Record<string, any> = { emails: formattedEmails };
    if (tags && Object.keys(tags).length > 0) {
      requestBody['tags'] = Object.values(tags).map(Number);
    }
    try {
      const result = await sendPulseApiCall<{ result: boolean }>({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: `/addressbooks/${addressBookId}/emails`,
        body: requestBody,
      });
      if (result.result === true) {
        return {
          success: true,
          message: 'Emails added successfully.',
          emailsAdded: formattedEmails,
          mailingListId: addressBookId,
          tagsAssigned: requestBody['tags'] || [],
        };
      }
      throw new Error('SendPulse API returned failure.');
    } catch (error: any) {
      throw new Error(`SendPulse error: ${error.message || 'Unknown error'}`);
    }
  },
}); 