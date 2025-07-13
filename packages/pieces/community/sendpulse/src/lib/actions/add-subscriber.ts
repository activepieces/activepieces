import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';

export const addSubscriberAction = createAction({
  auth: sendpulseAuth,
  name: 'add-subscriber',
  displayName: 'Add Emails to Mailing List',
  description: 'Adds one or more emails to a mailing list (single-opt-in).',
  props: {
    mailingListId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'ID of the SendPulse address book (mailing list)',
      required: true,
    }),
    email: Property.Array({
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
    const { mailingListId, email, variables, tags } = context.propsValue;

    const formattedEmails: any[] = [];

    for (let i = 0; i < email.length; i++) {
      const item: any = {
        email: email[i],
      };

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

    const requestBody: Record<string, any> = {
      emails: formattedEmails,
    };

    if (tags && Object.keys(tags).length > 0) {
      requestBody['tags'] = Object.values(tags).map(Number);
    }

    try {
      const result = await sendpulseApiCall<{ result: boolean }>({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: `/addressbooks/${mailingListId}/emails`,
        body: requestBody,
      });

      if (result.result === true) {
        return {
          success: true,
          message: 'Emails added successfully.',
          emailsAdded: formattedEmails,
          mailingListId,
          tagsAssigned: requestBody['tags'] || [],
        };
      }

      throw new Error('SendPulse API returned failure.');
    } catch (error: any) {
      throw new Error(
        `SendPulse error: ${error.message || 'Unknown error'}`
      );
    }
  },
});
