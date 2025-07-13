import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';
import { sendpulseApiCall } from '../common/client';

export const changeVariableForSubscriberAction = createAction({
  auth: sendpulseAuth,
  name: 'change-variable-for-subscriber',
  displayName: 'Change Variable for Subscriber',
  description: 'Update a specific variable (field) for a subscriber in a mailing list.',
  props: {
    mailingListId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'ID of the address book containing the subscriber',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Subscriber Email',
      required: true,
    }),
    variableName: Property.ShortText({
      displayName: 'Variable Name',
      description: 'Name of the variable to update (e.g., Phone, FirstName, etc.)',
      required: true,
    }),
    variableValue: Property.ShortText({
      displayName: 'Variable Value',
      description: 'New value for the variable',
      required: true,
    }),
  },

  async run(context) {
    const { mailingListId, email, variableName, variableValue } = context.propsValue;

    const body = {
      email,
      variables: [
        {
          name: variableName,
          value: variableValue,
        },
      ],
    };

    try {
      const result = await sendpulseApiCall<{ result: boolean }>({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: `/addressbooks/${mailingListId}/emails/variable`,
        body,
      });

      if (result.result) {
        return {
          success: true,
          message: `Variable "${variableName}" updated for subscriber ${email}.`,
          email,
          variableName,
          variableValue,
        };
      } else {
        throw new Error('SendPulse API returned failure.');
      }
    } catch (error: any) {
      throw new Error(`SendPulse error: ${error.message || 'Unknown error'}`);
    }
  },
});
