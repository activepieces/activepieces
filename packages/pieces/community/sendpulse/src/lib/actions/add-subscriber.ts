import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';
import { mailingListDropdown } from '../common/props';

export const addSubscriberAction = createAction({
  auth: sendpulseAuth,
  name: 'add-subscriber',
  displayName: 'Add Subscriber',
  description: 'Add subscriber to mailing list',
  props: {
    mailingListId: mailingListDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Subscriber email address',
      required: true,
    }),
    variables: Property.Object({
      displayName: 'Variables',
      description: 'Optional subscriber variables (e.g., name, phone)',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tag IDs',
      description: 'Optional tag IDs to assign',
      required: false,
    }),
  },

  async run(context) {
    const { mailingListId, email, variables, tags } = context.propsValue;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    const emailObject: any = { email };
    if (variables && Object.keys(variables).length > 0) {
      emailObject.variables = variables;
    }

    const requestBody: any = {
      emails: [emailObject],
    };

    if (tags && tags.length > 0) {
      const tagNumbers = tags.map((tag) => {
        const num = Number(tag);
        if (isNaN(num)) {
          throw new Error(`Invalid tag ID: ${tag}. Tag IDs must be numbers.`);
        }
        return num;
      });
      requestBody.tags = tagNumbers;
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
          message: 'Subscriber added successfully',
          email,
          variables: variables || {},
          mailingListId,
          tags: requestBody.tags || [],
        };
      }

      throw new Error('SendPulse API returned failure');
    } catch (error: any) {
      throw new Error(`Failed to add subscriber: ${error.message || 'Unknown error'}`);
    }
  },
});
